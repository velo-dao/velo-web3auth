import { Web3AuthSigner } from "./signer";
import { connectClientAndProvider, decrypt, sendAndListenOnce, WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY } from "./utils";
import { makeADR36AminoSignDoc } from "@keplr-wallet/cosmos";
import { encrypt, generatePrivate, getPublic } from "@toruslabs/eccrypto";
const terminate = typeof Worker !== "undefined" ? Worker.prototype.terminate : undefined;
export class Web3AuthClient {
    #clientPrivateKey;
    #options;
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
        localStorage.removeItem(WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY);
        try {
            const { client } = await connectClientAndProvider(this.env.device === "mobile", this.#options, this.loginHint, { dontAttemptLogin: true });
            if (client.connected) {
                await client.logout({
                    cleanup: true
                });
            }
        }
        catch (error) {
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
        const { client, provider } = await connectClientAndProvider(this.env.device === "mobile", this.#options, this.loginHint);
        const userInfo = await client.getUserInfo();
        const privateKeyHex = await provider?.request({
            method: "private_key"
        });
        if (typeof privateKeyHex !== "string") {
            throw new TypeError(`Failed to connect to ${this.#options.loginProvider}`);
        }
        const clientPrivateKey = generatePrivate();
        const clientPublicKey = getPublic(clientPrivateKey).toString("hex");
        const worker = new Worker(new URL("web3auth.worker.js", import.meta.url));
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