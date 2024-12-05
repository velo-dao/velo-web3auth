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
Object.defineProperty(exports, "__esModule", { value: true });
const utils_js_1 = require("./utils.js");
const amino_1 = require("@cosmjs/amino");
const proto_signing_1 = require("@cosmjs/proto-signing");
const eccrypto_1 = require("@toruslabs/eccrypto");
let clientPublicKey;
let workerPrivateKey;
let walletPrivateKey;
// eslint-disable-next-line consistent-return
self.onmessage = (_a) => __awaiter(void 0, [_a], void 0, function* ({ data }) {
    if (data.type === "init_1") {
        try {
            // Store the client's public key.
            clientPublicKey = Buffer.from(data.payload.publicKey, "hex");
            // Generate a private key for this worker.
            workerPrivateKey = (0, eccrypto_1.generatePrivate)();
            // Encrypt the worker's public key for the client.
            const encryptedPublicKey = yield (0, eccrypto_1.encrypt)(clientPublicKey, (0, eccrypto_1.getPublic)(workerPrivateKey));
            return self.postMessage({
                payload: {
                    encryptedPublicKey
                },
                type: "ready_1"
            }, "*");
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error("Web3Auth worker init_1 error", error);
            return self.postMessage({
                payload: {
                    error: error instanceof Error ? error.message : `${error}`
                },
                type: "init_error"
            }, "*");
        }
    }
    if (!clientPublicKey || !workerPrivateKey) {
        throw new Error("Web3Auth worker not initialized");
    }
    if (data.type === "init_2") {
        try {
            // Decrypt the private key encrypted by the client.
            walletPrivateKey = yield (0, utils_js_1.decrypt)(workerPrivateKey, data.payload.encryptedPrivateKey);
            return self.postMessage({
                type: "ready_2"
            }, "*");
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error("Web3Auth worker init_2 error", error);
            return self.postMessage({
                payload: {
                    error: error instanceof Error ? error.message : `${error}`
                },
                type: "init_error"
            }, "*");
        }
    }
    if (!walletPrivateKey) {
        throw new Error("Web3Auth client not initialized");
    }
    if (data.type === "request_accounts") {
        let payload;
        try {
            const accounts = yield (yield proto_signing_1.DirectSecp256k1Wallet.fromKey(walletPrivateKey, data.payload.chainBech32Prefix)).getAccounts();
            payload = {
                id: data.payload.id,
                response: {
                    accounts,
                    type: "success"
                }
            };
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error("Web3Auth worker accounts error", error);
            payload = {
                id: data.payload.id,
                response: {
                    error: error instanceof Error ? error.message : `${error}`,
                    type: "error"
                }
            };
        }
        const signature = yield (0, eccrypto_1.sign)(workerPrivateKey, (0, utils_js_1.hashObject)(payload));
        return self.postMessage({
            payload,
            signature,
            type: "accounts"
        }, "*");
    }
    if (data.type === "request_sign") {
        let payload;
        try {
            // Verify signature.
            yield (0, eccrypto_1.verify)(clientPublicKey, (0, utils_js_1.hashObject)(data.payload), Buffer.from(data.signature));
            if (data.payload.data.type === "direct") {
                const response = yield (yield proto_signing_1.DirectSecp256k1Wallet.fromKey(walletPrivateKey, data.payload.chainBech32Prefix)).signDirect(data.payload.signerAddress, data.payload.data.value);
                payload = {
                    id: data.payload.id,
                    response: {
                        type: "direct",
                        value: response
                    }
                };
            }
            else if (data.payload.data.type === "amino") {
                const response = yield (yield amino_1.Secp256k1Wallet.fromKey(walletPrivateKey, data.payload.chainBech32Prefix)).signAmino(data.payload.signerAddress, data.payload.data.value);
                payload = {
                    id: data.payload.id,
                    response: {
                        type: "amino",
                        value: response
                    }
                };
            }
            else {
                throw new Error("Invalid sign data type");
            }
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error("Web3Auth worker sign error", error);
            payload = {
                id: data.payload.id,
                response: {
                    type: "error",
                    value: error instanceof Error ? error.message : `${error}`
                }
            };
        }
        const signature = yield (0, eccrypto_1.sign)(workerPrivateKey, (0, utils_js_1.hashObject)(payload));
        return self.postMessage({
            payload,
            signature,
            type: "sign"
        }, "*");
    }
});
//# sourceMappingURL=web3auth.worker.js.map