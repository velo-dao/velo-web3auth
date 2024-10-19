import { decrypt, hashObject } from "./utils";
import { Secp256k1Wallet } from "@cosmjs/amino";
import { DirectSecp256k1Wallet } from "@cosmjs/proto-signing";
import { encrypt, generatePrivate, getPublic, sign, verify } from "@toruslabs/eccrypto";
let clientPublicKey;
let workerPrivateKey;
let walletPrivateKey;
self.onmessage = async ({ data }) => {
    if (data.type === "init_1") {
        try {
            clientPublicKey = Buffer.from(data.payload.publicKey, "hex");
            workerPrivateKey = generatePrivate();
            const encryptedPublicKey = await encrypt(clientPublicKey, getPublic(workerPrivateKey));
            return self.postMessage({
                payload: {
                    encryptedPublicKey
                },
                type: "ready_1"
            });
        }
        catch (error) {
            console.error("Web3Auth worker init_1 error", error);
            return self.postMessage({
                payload: {
                    error: error instanceof Error ? error.message : `${error}`
                },
                type: "init_error"
            });
        }
    }
    if (!clientPublicKey || !workerPrivateKey) {
        throw new Error("Web3Auth worker not initialized");
    }
    if (data.type === "init_2") {
        try {
            walletPrivateKey = await decrypt(workerPrivateKey, data.payload.encryptedPrivateKey);
            return self.postMessage({
                type: "ready_2"
            });
        }
        catch (error) {
            console.error("Web3Auth worker init_2 error", error);
            return self.postMessage({
                payload: {
                    error: error instanceof Error ? error.message : `${error}`
                },
                type: "init_error"
            });
        }
    }
    if (!walletPrivateKey) {
        throw new Error("Web3Auth client not initialized");
    }
    if (data.type === "request_accounts") {
        let payload;
        try {
            const accounts = await (await DirectSecp256k1Wallet.fromKey(walletPrivateKey, data.payload.chainBech32Prefix)).getAccounts();
            payload = {
                id: data.payload.id,
                response: {
                    accounts,
                    type: "success"
                }
            };
        }
        catch (error) {
            console.error("Web3Auth worker accounts error", error);
            payload = {
                id: data.payload.id,
                response: {
                    error: error instanceof Error ? error.message : `${error}`,
                    type: "error"
                }
            };
        }
        const signature = await sign(workerPrivateKey, hashObject(payload));
        return self.postMessage({
            payload,
            signature,
            type: "accounts"
        });
    }
    if (data.type === "request_sign") {
        let payload;
        try {
            await verify(clientPublicKey, hashObject(data.payload), Buffer.from(data.signature));
            if (data.payload.data.type === "direct") {
                const response = await (await DirectSecp256k1Wallet.fromKey(walletPrivateKey, data.payload.chainBech32Prefix)).signDirect(data.payload.signerAddress, data.payload.data.value);
                payload = {
                    id: data.payload.id,
                    response: {
                        type: "direct",
                        value: response
                    }
                };
            }
            else if (data.payload.data.type === "amino") {
                const response = await (await Secp256k1Wallet.fromKey(walletPrivateKey, data.payload.chainBech32Prefix)).signAmino(data.payload.signerAddress, data.payload.data.value);
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
            console.error("Web3Auth worker sign error", error);
            payload = {
                id: data.payload.id,
                response: {
                    type: "error",
                    value: error instanceof Error ? error.message : `${error}`
                }
            };
        }
        const signature = await sign(workerPrivateKey, hashObject(payload));
        return self.postMessage({
            payload,
            signature,
            type: "sign"
        });
    }
};
//# sourceMappingURL=web3auth.worker.js.map