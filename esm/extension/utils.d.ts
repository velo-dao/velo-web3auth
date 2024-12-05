import { type FromWorkerMessage, type ToWorkerMessage, type Web3AuthClientOptions } from "./types.js";
import { type Ecies } from "@toruslabs/eccrypto";
import { type SafeEventEmitterProvider } from "@web3auth/base";
import { Web3AuthNoModal } from "@web3auth/no-modal";
export declare const WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY = "__cosmos-kit_web3auth_redirect_auto_connect";
export declare const listenOnce: (worker: Worker, callback: (message: FromWorkerMessage) => boolean | Promise<boolean>) => void;
export declare const sendAndListenOnce: (worker: Worker, message: ToWorkerMessage, callback: (message: FromWorkerMessage) => boolean | Promise<boolean>) => Promise<void>;
export declare const decrypt: (privateKey: Buffer | Uint8Array, { ciphertext, ephemPublicKey, iv, mac }: Ecies) => Promise<Buffer>;
export declare const hashObject: (object: any) => Buffer;
export declare const connectClientAndProvider: (isMobile: boolean, options: Web3AuthClientOptions, loginHint?: string, { dontAttemptLogin }?: {
    dontAttemptLogin?: boolean | undefined;
}) => Promise<{
    client: Web3AuthNoModal;
    provider: null | SafeEventEmitterProvider;
}>;
