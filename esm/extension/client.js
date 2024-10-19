import { Web3AuthSigner } from "./signer";
import { connectClientAndProvider, decrypt, sendAndListenOnce, WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY } from "./utils";
import { makeADR36AminoSignDoc } from "@keplr-wallet/cosmos";
import { encrypt, generatePrivate, getPublic } from "@toruslabs/eccrypto";
// In case these get overwritten by an attacker.
const terminate = typeof Worker !== "undefined" ? Worker.prototype.terminate : undefined;
export class Web3AuthClient {
    #clientPrivateKey;
    #options;
    // Map chain ID to signer.
    #signers = {};
    #userInfo;
    #worker;
    #workerPublicKey;
    _defaultSignOptions = {
        disableBalanceCheck: true,
        preferNoSetFee: false,
        preferNoSetMemo: true
    };
    env;
    getChain;
    loginHint;
    ready = false;
    constructor(env, options, getChain) {
        this.env = env;
        this.#options = Object.freeze(options);
        this.getChain = getChain;
    }
    async connect(_chainIds) {
        await this.ensureSetup();
        const _chains = [_chainIds].flat().map((chainId) => {
            const chain = this.getChain(chainId);
            if (!chain) {
                throw new Error(`Chain ID ${chainId} not found`);
            }
            return chain;
        });
        // Create signers.
        for (const chain of _chains) {
            if (!this.#worker ||
                !this.#clientPrivateKey ||
                !this.#workerPublicKey ||
                !this.#options) {
                throw new Error("Web3Auth client not initialized");
            }
            this.#signers[chain.chain_id] = new Web3AuthSigner(chain, this.#worker, this.#clientPrivateKey, this.#workerPublicKey, this.#options.promptSign);
        }
    }
    async disconnect() {
        if (!this.#options) {
            throw new Error("Web3Auth client not initialized");
        }
        // In case this web3auth client uses the redirect auto connect method, clear
        // it so that it does not automatically connect on the next page load.
        localStorage.removeItem(WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY);
        // Attempt to logout by first connecting a new client and then logging out
        // if connected. It does not attempt to log in if it cannot automatically
        // login from the cached session. This removes the need to keep the client
        // around, which internally keeps a reference to the private key.
        try {
            const { client } = await connectClientAndProvider(this.env.device === "mobile", this.#options, this.loginHint, { dontAttemptLogin: true });
            if (client.connected) {
                await client.logout({
                    cleanup: true
                });
            }
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.warn("Web3Auth failed to logout:", error);
        }
        this.#signers = {};
        this.#userInfo = {};
        this.loginHint = undefined;
        if (this.#worker) {
            terminate?.call(this.#worker);
            this.#worker = undefined;
        }
        this.ready = false;
    }
    async ensureSetup() {
        if (this.ready) {
            return;
        }
        if (!this.#options) {
            throw new Error("Web3Auth client not initialized");
        }
        this.loginHint = localStorage.getItem("@velo/loginHint") ?? undefined;
        if ((this.#options.loginProvider === "email_passwordless" &&
            !this.loginHint) ||
            (this.#options.loginProvider === "sms_passwordless" && !this.loginHint)) {
            throw new Error("Tried signing in with email/sms but did not enter an address/number");
        }
        // Don't keep any reference to these around after this function since they
        // internally store a reference to the private key. Once we have the private
        // key, send it to the worker and forget about it. After this function, the
        // only reference to the private key is in the worker, and this client and
        // provider will be destroyed by the garbage collector, hopefully ASAP.
        const { client, provider } = await connectClientAndProvider(this.env.device === "mobile", this.#options, this.loginHint);
        // Get connected user info.
        const userInfo = await client.getUserInfo();
        // Get the private key.
        const privateKeyHex = await provider?.request({
            method: "private_key"
        });
        if (typeof privateKeyHex !== "string") {
            throw new TypeError(`Failed to connect to ${this.#options.loginProvider}`);
        }
        // Generate a private key for this client to interact with the worker.
        const clientPrivateKey = generatePrivate();
        const clientPublicKey = getPublic(clientPrivateKey).toString("hex");
        // Spawn a new worker that will handle the private key and signing.
        const worker = new Worker(new URL("web3auth.worker.js", import.meta.url));
        // Begin two-step handshake to authenticate with the worker and exchange
        // communication public keys as well as the wallet private key.
        // 1. Send client public key so the worker can verify our signatures, and
        //    get the worker public key for encrypting the wallet private key in the
        //    next init step.
        let workerPublicKey;
        await sendAndListenOnce(worker, {
            payload: {
                publicKey: clientPublicKey
            },
            type: "init_1"
        }, async (data) => {
            if (data.type === "ready_1") {
                workerPublicKey = await decrypt(clientPrivateKey, data.payload.encryptedPublicKey);
                return true;
            }
            else if (data.type === "init_error") {
                throw new Error(data.payload.error);
            }
            return false;
        });
        if (!workerPublicKey) {
            throw new Error("Failed to authenticate with worker");
        }
        // 2. Encrypt and send the wallet private key to the worker. This is the
        //    last usage of `workerPublicKey`, so it should get garbage collected
        //    ASAP once this function ends.
        const encryptedPrivateKey = await encrypt(workerPublicKey, Buffer.from(privateKeyHex, "hex"));
        await sendAndListenOnce(worker, {
            payload: {
                encryptedPrivateKey
            },
            type: "init_2"
        }, (data) => {
            if (data.type === "ready_2") {
                return true;
            }
            else if (data.type === "init_error") {
                throw new Error(data.payload.error);
            }
            return false;
        });
        // Store the setup instances.
        this.#worker = worker;
        this.#clientPrivateKey = clientPrivateKey;
        this.#workerPublicKey = workerPublicKey;
        this.#userInfo = userInfo;
        this.ready = true;
    }
    async getAccount(chainId) {
        if (!this.#userInfo) {
            throw new Error("Web3Auth client not initialized");
        }
        const { address, algo, pubkey } = (await this.getOfflineSigner(chainId).getAccounts())[0];
        return {
            address,
            algo,
            pubkey,
            username: this.#userInfo.name || this.#userInfo.email || address
        };
    }
    getOfflineSigner(chainId) {
        const signer = this.#signers[chainId];
        if (!signer) {
            throw new Error("Signer not enabled");
        }
        return signer;
    }
    getOfflineSignerAmino(chainId) {
        return this.getOfflineSigner(chainId);
    }
    getOfflineSignerDirect(chainId) {
        return this.getOfflineSigner(chainId);
    }
    async getSimpleAccount(chainId) {
        const { address, username } = await this.getAccount(chainId);
        return {
            address,
            chainId,
            namespace: "cosmos",
            username
        };
    }
    setDefaultSignOptions(options) {
        this._defaultSignOptions = options;
    }
    async signArbitrary(chainId, signer, data) {
        // ADR 036
        // https://docs.cosmos.network/v0.47/architecture/adr-036-arbitrary-signature
        const signDoc = makeADR36AminoSignDoc(signer, data);
        const offlineSigner = this.getOfflineSignerAmino(chainId);
        const { signature } = await offlineSigner.signAmino(signer, signDoc);
        return signature;
    }
    get defaultSignOptions() {
        return this._defaultSignOptions;
    }
}
//# sourceMappingURL=client.js.map