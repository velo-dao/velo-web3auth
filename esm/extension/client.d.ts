import { Web3AuthSigner } from "./signer";
import { type Web3AuthClientOptions } from "./types";
import { type Chain } from "@chain-registry/types";
import { type OfflineAminoSigner, type StdSignature } from "@cosmjs/amino";
import { type OfflineDirectSigner } from "@cosmjs/proto-signing";
import { type DappEnv, type SignOptions, type WalletClient } from "@cosmos-kit/core";
export declare class Web3AuthClient implements WalletClient {
    #private;
    env: DappEnv;
    getChain: (chainId: string) => Chain | undefined;
    loginHint: string | undefined;
    ready: boolean;
    get defaultSignOptions(): SignOptions;
    private _defaultSignOptions;
    constructor(environment: DappEnv, options: Web3AuthClientOptions, getChain: (chainId: string) => Chain | undefined);
    connect(_chainIds: string | string[]): Promise<void>;
    disconnect(): Promise<void>;
    ensureSetup(): Promise<void>;
    getAccount(chainId: string): Promise<{
        address: string;
        algo: import("@cosmjs/proto-signing").Algo;
        pubkey: Uint8Array<ArrayBufferLike>;
        username: string;
    }>;
    getOfflineSigner(chainId: string): Web3AuthSigner;
    getOfflineSignerAmino(chainId: string): OfflineAminoSigner;
    getOfflineSignerDirect(chainId: string): OfflineDirectSigner;
    getSimpleAccount(chainId: string): Promise<{
        address: string;
        chainId: string;
        namespace: string;
        username: string;
    }>;
    setDefaultSignOptions(options: SignOptions): void;
    signArbitrary(chainId: string, signer: string, data: string | Uint8Array): Promise<StdSignature>;
}
