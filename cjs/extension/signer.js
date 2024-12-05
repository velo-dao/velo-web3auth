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
var _Web3AuthSigner_clientPrivateKey, _Web3AuthSigner_promptSign, _Web3AuthSigner_worker, _Web3AuthSigner_workerPublicKey;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3AuthSigner = void 0;
const utils_1 = require("./utils");
const eccrypto_1 = require("@toruslabs/eccrypto");
class Web3AuthSigner {
    constructor(chain, worker, clientPrivateKey, workerPublicKey, promptSign) {
        _Web3AuthSigner_clientPrivateKey.set(this, void 0);
        _Web3AuthSigner_promptSign.set(this, void 0);
        _Web3AuthSigner_worker.set(this, void 0);
        _Web3AuthSigner_workerPublicKey.set(this, void 0);
        this.chain = chain;
        __classPrivateFieldSet(this, _Web3AuthSigner_worker, worker, "f");
        __classPrivateFieldSet(this, _Web3AuthSigner_clientPrivateKey, clientPrivateKey, "f");
        __classPrivateFieldSet(this, _Web3AuthSigner_workerPublicKey, workerPublicKey, "f");
        __classPrivateFieldSet(this, _Web3AuthSigner_promptSign, promptSign, "f");
    }
    getAccounts() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            let accounts;
            const id = Date.now();
            // Should not resolve until accounts are received.
            yield (0, utils_1.sendAndListenOnce)(__classPrivateFieldGet(this, _Web3AuthSigner_worker, "f"), {
                payload: {
                    chainBech32Prefix: (_a = this.chain.bech32_prefix) !== null && _a !== void 0 ? _a : "",
                    id
                },
                type: "request_accounts"
            }, (data) => __awaiter(this, void 0, void 0, function* () {
                if (data.type === "accounts" && data.payload.id === id) {
                    // Verify signature.
                    yield (0, eccrypto_1.verify)(__classPrivateFieldGet(this, _Web3AuthSigner_workerPublicKey, "f"), (0, utils_1.hashObject)(data.payload), Buffer.from(data.signature));
                    if (data.payload.response.type === "success") {
                        accounts = data.payload.response.accounts;
                        return true;
                    }
                    else {
                        throw new Error(data.payload.response.error);
                    }
                }
                return false;
            }));
            if (!accounts) {
                throw new Error("Failed to get accounts");
            }
            return accounts;
        });
    }
    signAmino(signerAddress, signDocument) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (signDocument.chain_id !== this.chain.chain_id) {
                throw new Error("Chain ID mismatch");
            }
            const signData = {
                type: "amino",
                value: signDocument
            };
            if (!(yield __classPrivateFieldGet(this, _Web3AuthSigner_promptSign, "f").call(this, signerAddress, signData))) {
                throw new Error("Request rejected");
            }
            // Create and sign signature request.
            const id = Date.now();
            const message = {
                payload: {
                    chainBech32Prefix: (_a = this.chain.bech32_prefix) !== null && _a !== void 0 ? _a : "",
                    data: signData,
                    id,
                    signerAddress
                },
                signature: new Uint8Array(),
                type: "request_sign"
            };
            message.signature = yield (0, eccrypto_1.sign)(__classPrivateFieldGet(this, _Web3AuthSigner_clientPrivateKey, "f"), (0, utils_1.hashObject)(message.payload));
            let response;
            // Should not resolve until response is received.
            yield (0, utils_1.sendAndListenOnce)(__classPrivateFieldGet(this, _Web3AuthSigner_worker, "f"), message, (data) => __awaiter(this, void 0, void 0, function* () {
                if (data.type === "sign" && data.payload.id === id) {
                    // Verify signature.
                    yield (0, eccrypto_1.verify)(__classPrivateFieldGet(this, _Web3AuthSigner_workerPublicKey, "f"), (0, utils_1.hashObject)(data.payload), Buffer.from(data.signature));
                    if (data.payload.response.type === "error") {
                        throw new Error(data.payload.response.value);
                    }
                    // Type-check, should always be true.
                    if (data.payload.response.type === "amino") {
                        response = data.payload.response.value;
                    }
                    return true;
                }
                return false;
            }));
            if (!response) {
                throw new Error("Failed to get response");
            }
            return response;
        });
    }
    signDirect(signerAddress, signDocument) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (signDocument.chainId !== this.chain.chain_id) {
                throw new Error("Chain ID mismatch");
            }
            const signData = {
                type: "direct",
                value: signDocument
            };
            if (!(yield __classPrivateFieldGet(this, _Web3AuthSigner_promptSign, "f").call(this, signerAddress, signData))) {
                throw new Error("Request rejected");
            }
            // Create and sign signature request.
            const id = Date.now();
            const message = {
                payload: {
                    chainBech32Prefix: (_a = this.chain.bech32_prefix) !== null && _a !== void 0 ? _a : "",
                    data: signData,
                    id,
                    signerAddress
                },
                signature: new Uint8Array(),
                type: "request_sign"
            };
            message.signature = yield (0, eccrypto_1.sign)(__classPrivateFieldGet(this, _Web3AuthSigner_clientPrivateKey, "f"), (0, utils_1.hashObject)(message.payload));
            let response;
            // Should not resolve until response is received.
            yield (0, utils_1.sendAndListenOnce)(__classPrivateFieldGet(this, _Web3AuthSigner_worker, "f"), message, (data) => __awaiter(this, void 0, void 0, function* () {
                if (data.type === "sign" && data.payload.id === id) {
                    // Verify signature.
                    yield (0, eccrypto_1.verify)(__classPrivateFieldGet(this, _Web3AuthSigner_workerPublicKey, "f"), (0, utils_1.hashObject)(data.payload), Buffer.from(data.signature));
                    if (data.payload.response.type === "error") {
                        throw new Error(data.payload.response.value);
                    }
                    // Type-check, should always be true.
                    if (data.payload.response.type === "direct") {
                        response = data.payload.response.value;
                    }
                    return true;
                }
                return false;
            }));
            if (!response) {
                throw new Error("Failed to get response");
            }
            return response;
        });
    }
}
exports.Web3AuthSigner = Web3AuthSigner;
_Web3AuthSigner_clientPrivateKey = new WeakMap(), _Web3AuthSigner_promptSign = new WeakMap(), _Web3AuthSigner_worker = new WeakMap(), _Web3AuthSigner_workerPublicKey = new WeakMap();
//# sourceMappingURL=signer.js.map