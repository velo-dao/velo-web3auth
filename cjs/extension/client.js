"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Web3AuthClient_clientPrivateKey, _Web3AuthClient_options, _Web3AuthClient_signers, _Web3AuthClient_userInfo, _Web3AuthClient_worker, _Web3AuthClient_workerPublicKey;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3AuthClient = void 0;
/* eslint-disable no-negated-condition */
const signer_1 = require("./signer");
const utils_js_1 = require("./utils.js");
const cosmos_1 = require("@keplr-wallet/cosmos");
const eccrypto_1 = require("@toruslabs/eccrypto");
// In case these get overwritten by an attacker.
const terminate = typeof Worker === "undefined" ? undefined : Worker.prototype.terminate;
// Helper function to get worker URL in both CJS and ESM environments
const getWorkerUrl = () => {
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
        return null;
    }
    if (typeof window !== "undefined") {
        // Browser environment
        const currentScript = document.currentScript;
        if (currentScript) {
            const scriptUrl = new URL(currentScript.src);
            return `${scriptUrl.origin}/web3auth.worker.js`;
        }
        // Fallback for when currentScript is not available
        return "/web3auth.worker.js";
    }
    else {
        // Node.js environment
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, unicorn/prefer-module
        const path = require("path");
        // eslint-disable-next-line unicorn/prefer-module
        return path.join(__dirname, "web3auth.worker.js");
    }
};
class Web3AuthClient {
    get defaultSignOptions() {
        return this._defaultSignOptions;
    }
    constructor(environment, options, getChain) {
        this.ready = false;
        _Web3AuthClient_clientPrivateKey.set(this, void 0);
        _Web3AuthClient_options.set(this, void 0);
        // Map chain ID to signer.
        _Web3AuthClient_signers.set(this, {});
        _Web3AuthClient_userInfo.set(this, void 0);
        _Web3AuthClient_worker.set(this, void 0);
        _Web3AuthClient_workerPublicKey.set(this, void 0);
        this._defaultSignOptions = {
            disableBalanceCheck: true,
            preferNoSetFee: false,
            preferNoSetMemo: true
        };
        this.env = environment;
        __classPrivateFieldSet(this, _Web3AuthClient_options, Object.freeze(options), "f");
        this.getChain = getChain;
    }
    connect(_chainIds) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureSetup();
            const _chains = [_chainIds].flat().map((chainId) => {
                const chain = this.getChain(chainId);
                if (!chain) {
                    throw new Error(`Chain ID ${chainId} not found`);
                }
                return chain;
            });
            // Create signers.
            for (const chain of _chains) {
                if (!__classPrivateFieldGet(this, _Web3AuthClient_worker, "f") ||
                    !__classPrivateFieldGet(this, _Web3AuthClient_clientPrivateKey, "f") ||
                    !__classPrivateFieldGet(this, _Web3AuthClient_workerPublicKey, "f") ||
                    !__classPrivateFieldGet(this, _Web3AuthClient_options, "f")) {
                    throw new Error("Web3Auth client not initialized");
                }
                __classPrivateFieldGet(this, _Web3AuthClient_signers, "f")[chain.chain_id] = new signer_1.Web3AuthSigner(chain, __classPrivateFieldGet(this, _Web3AuthClient_worker, "f"), __classPrivateFieldGet(this, _Web3AuthClient_clientPrivateKey, "f"), __classPrivateFieldGet(this, _Web3AuthClient_workerPublicKey, "f"), __classPrivateFieldGet(this, _Web3AuthClient_options, "f").promptSign);
            }
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!__classPrivateFieldGet(this, _Web3AuthClient_options, "f")) {
                throw new Error("Web3Auth client not initialized");
            }
            // In case this web3auth client uses the redirect auto connect method, clear
            // it so that it does not automatically connect on the next page load.
            localStorage.removeItem(utils_js_1.WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY);
            // Attempt to logout by first connecting a new client and then logging out
            // if connected. It does not attempt to log in if it cannot automatically
            // login from the cached session. This removes the need to keep the client
            // around, which internally keeps a reference to the private key.
            try {
                const { client } = yield (0, utils_js_1.connectClientAndProvider)(this.env.device === "mobile", __classPrivateFieldGet(this, _Web3AuthClient_options, "f"), this.loginHint, { dontAttemptLogin: true });
                if (client.connected) {
                    yield client.logout({
                        cleanup: true
                    });
                }
            }
            catch (error) {
                // eslint-disable-next-line no-console
                console.warn("Web3Auth failed to logout:", error);
            }
            __classPrivateFieldSet(this, _Web3AuthClient_signers, {}, "f");
            __classPrivateFieldSet(this, _Web3AuthClient_userInfo, {}, "f");
            this.loginHint = undefined;
            if (__classPrivateFieldGet(this, _Web3AuthClient_worker, "f")) {
                terminate === null || terminate === void 0 ? void 0 : terminate.call(__classPrivateFieldGet(this, _Web3AuthClient_worker, "f"));
                __classPrivateFieldSet(this, _Web3AuthClient_worker, undefined, "f");
            }
            this.ready = false;
        });
    }
    ensureSetup() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.ready) {
                return;
            }
            if (!__classPrivateFieldGet(this, _Web3AuthClient_options, "f")) {
                throw new Error("Web3Auth client not initialized");
            }
            this.loginHint = (_a = localStorage.getItem("@velo/loginHint")) !== null && _a !== void 0 ? _a : undefined;
            if ((__classPrivateFieldGet(this, _Web3AuthClient_options, "f").loginProvider === "email_passwordless" &&
                !this.loginHint) ||
                (__classPrivateFieldGet(this, _Web3AuthClient_options, "f").loginProvider === "sms_passwordless" && !this.loginHint)) {
                throw new Error("Tried signing in with email/sms but did not enter an address/number");
            }
            // Don't keep any reference to these around after this function since they
            // internally store a reference to the private key. Once we have the private
            // key, send it to the worker and forget about it. After this function, the
            // only reference to the private key is in the worker, and this client and
            // provider will be destroyed by the garbage collector, hopefully ASAP.
            const { client, provider } = yield (0, utils_js_1.connectClientAndProvider)(this.env.device === "mobile", __classPrivateFieldGet(this, _Web3AuthClient_options, "f"), this.loginHint);
            // Get connected user info.
            const userInfo = yield client.getUserInfo();
            // Get the private key.
            const privateKeyHex = yield (provider === null || provider === void 0 ? void 0 : provider.request({
                method: "private_key"
            }));
            if (typeof privateKeyHex !== "string") {
                throw new TypeError(`Failed to connect to ${__classPrivateFieldGet(this, _Web3AuthClient_options, "f").loginProvider}`);
            }
            // Generate a private key for this client to interact with the worker.
            const clientPrivateKey = (0, eccrypto_1.generatePrivate)();
            const clientPublicKey = (0, eccrypto_1.getPublic)(clientPrivateKey).toString("hex");
            // Spawn a new worker that will handle the private key and signing.
            const workerUrl = getWorkerUrl();
            const worker = new Worker(workerUrl);
            // Begin two-step handshake to authenticate with the worker and exchange
            // communication public keys as well as the wallet private key.
            // 1. Send client public key so the worker can verify our signatures, and
            //    get the worker public key for encrypting the wallet private key in the
            //    next init step.
            let workerPublicKey;
            yield (0, utils_js_1.sendAndListenOnce)(worker, {
                payload: {
                    publicKey: clientPublicKey
                },
                type: "init_1"
            }, (data) => __awaiter(this, void 0, void 0, function* () {
                if (data.type === "ready_1") {
                    workerPublicKey = yield (0, utils_js_1.decrypt)(clientPrivateKey, data.payload.encryptedPublicKey);
                    return true;
                }
                else if (data.type === "init_error") {
                    throw new Error(data.payload.error);
                }
                return false;
            }));
            if (!workerPublicKey) {
                throw new Error("Failed to authenticate with worker");
            }
            // 2. Encrypt and send the wallet private key to the worker. This is the
            //    last usage of `workerPublicKey`, so it should get garbage collected
            //    ASAP once this function ends.
            const encryptedPrivateKey = yield (0, eccrypto_1.encrypt)(workerPublicKey, Buffer.from(privateKeyHex, "hex"));
            yield (0, utils_js_1.sendAndListenOnce)(worker, {
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
            __classPrivateFieldSet(this, _Web3AuthClient_worker, worker, "f");
            __classPrivateFieldSet(this, _Web3AuthClient_clientPrivateKey, clientPrivateKey, "f");
            __classPrivateFieldSet(this, _Web3AuthClient_workerPublicKey, workerPublicKey, "f");
            __classPrivateFieldSet(this, _Web3AuthClient_userInfo, userInfo, "f");
            this.ready = true;
        });
    }
    getAccount(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!__classPrivateFieldGet(this, _Web3AuthClient_userInfo, "f")) {
                throw new Error("Web3Auth client not initialized");
            }
            const { address, algo, pubkey } = (yield this.getOfflineSigner(chainId).getAccounts())[0];
            return {
                address,
                algo,
                pubkey,
                username: __classPrivateFieldGet(this, _Web3AuthClient_userInfo, "f").name || __classPrivateFieldGet(this, _Web3AuthClient_userInfo, "f").email || address
            };
        });
    }
    getOfflineSigner(chainId) {
        const signer = __classPrivateFieldGet(this, _Web3AuthClient_signers, "f")[chainId];
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
    getSimpleAccount(chainId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { address, username } = yield this.getAccount(chainId);
            return {
                address,
                chainId,
                namespace: "cosmos",
                username
            };
        });
    }
    setDefaultSignOptions(options) {
        this._defaultSignOptions = options;
    }
    signArbitrary(chainId, signer, data) {
        return __awaiter(this, void 0, void 0, function* () {
            // ADR 036
            // https://docs.cosmos.network/v0.47/architecture/adr-036-arbitrary-signature
            const signDocument = (0, cosmos_1.makeADR36AminoSignDoc)(signer, data);
            const offlineSigner = this.getOfflineSignerAmino(chainId);
            const { signature } = yield offlineSigner.signAmino(signer, signDocument);
            return signature;
        });
    }
}
exports.Web3AuthClient = Web3AuthClient;
_Web3AuthClient_clientPrivateKey = new WeakMap(), _Web3AuthClient_options = new WeakMap(), _Web3AuthClient_signers = new WeakMap(), _Web3AuthClient_userInfo = new WeakMap(), _Web3AuthClient_worker = new WeakMap(), _Web3AuthClient_workerPublicKey = new WeakMap();
//# sourceMappingURL=client.js.map