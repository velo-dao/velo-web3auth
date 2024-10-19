import { sign, verify } from '@toruslabs/eccrypto';
import { hashObject, sendAndListenOnce } from './utils';
export class Web3AuthSigner {
    chain;
    #worker;
    #clientPrivateKey;
    #workerPublicKey;
    #promptSign;
    constructor(chain, worker, clientPrivateKey, workerPublicKey, promptSign) {
        this.chain = chain;
        this.#worker = worker;
        this.#clientPrivateKey = clientPrivateKey;
        this.#workerPublicKey = workerPublicKey;
        this.#promptSign = promptSign;
    }
    async getAccounts() {
        let accounts;
        const id = Date.now();
        // Should not resolve until accounts are received.
        await sendAndListenOnce(this.#worker, {
            type: 'request_accounts',
            payload: {
                id,
                chainBech32Prefix: this.chain.bech32_prefix ?? "",
            },
        }, async (data) => {
            if (data.type === 'accounts' && data.payload.id === id) {
                // Verify signature.
                await verify(this.#workerPublicKey, hashObject(data.payload), Buffer.from(data.signature));
                if (data.payload.response.type === 'success') {
                    accounts = data.payload.response.accounts;
                    return true;
                }
                else {
                    throw new Error(data.payload.response.error);
                }
            }
            return false;
        });
        if (!accounts) {
            throw new Error('Failed to get accounts');
        }
        return accounts;
    }
    async signDirect(signerAddress, signDoc) {
        if (signDoc.chainId !== this.chain.chain_id) {
            throw new Error('Chain ID mismatch');
        }
        const signData = {
            type: 'direct',
            value: signDoc,
        };
        if (!(await this.#promptSign(signerAddress, signData))) {
            throw new Error('Request rejected');
        }
        // Create and sign signature request.
        const id = Date.now();
        const message = {
            type: 'request_sign',
            payload: {
                id,
                signerAddress,
                chainBech32Prefix: this.chain.bech32_prefix ?? "",
                data: signData,
            },
            signature: new Uint8Array(),
        };
        message.signature = await sign(this.#clientPrivateKey, hashObject(message.payload));
        let response;
        // Should not resolve until response is received.
        await sendAndListenOnce(this.#worker, message, async (data) => {
            if (data.type === 'sign' && data.payload.id === id) {
                // Verify signature.
                await verify(this.#workerPublicKey, hashObject(data.payload), Buffer.from(data.signature));
                if (data.payload.response.type === 'error') {
                    throw new Error(data.payload.response.value);
                }
                // Type-check, should always be true.
                if (data.payload.response.type === 'direct') {
                    response = data.payload.response.value;
                }
                return true;
            }
            return false;
        });
        if (!response) {
            throw new Error('Failed to get response');
        }
        return response;
    }
    async signAmino(signerAddress, signDoc) {
        if (signDoc.chain_id !== this.chain.chain_id) {
            throw new Error('Chain ID mismatch');
        }
        const signData = {
            type: 'amino',
            value: signDoc,
        };
        if (!(await this.#promptSign(signerAddress, signData))) {
            throw new Error('Request rejected');
        }
        // Create and sign signature request.
        const id = Date.now();
        const message = {
            type: 'request_sign',
            payload: {
                id,
                signerAddress,
                chainBech32Prefix: this.chain.bech32_prefix ?? "",
                data: signData,
            },
            signature: new Uint8Array(),
        };
        message.signature = await sign(this.#clientPrivateKey, hashObject(message.payload));
        let response;
        // Should not resolve until response is received.
        await sendAndListenOnce(this.#worker, message, async (data) => {
            if (data.type === 'sign' && data.payload.id === id) {
                // Verify signature.
                await verify(this.#workerPublicKey, hashObject(data.payload), Buffer.from(data.signature));
                if (data.payload.response.type === 'error') {
                    throw new Error(data.payload.response.value);
                }
                // Type-check, should always be true.
                if (data.payload.response.type === 'amino') {
                    response = data.payload.response.value;
                }
                return true;
            }
            return false;
        });
        if (!response) {
            throw new Error('Failed to get response');
        }
        return response;
    }
}
//# sourceMappingURL=signer.js.map