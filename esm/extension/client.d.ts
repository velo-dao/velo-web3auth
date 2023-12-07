import { Chain } from '@chain-registry/types';
import { OfflineAminoSigner, StdSignature } from '@cosmjs/amino';
import { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { DappEnv, WalletClient } from '@cosmos-kit/core';
import { Web3AuthSigner } from './signer';
import { Web3AuthClientOptions } from './types';
export declare class Web3AuthClient implements WalletClient {
    #private;
    env: DappEnv;
    getChain: (chainId: string) => Chain | undefined;
    loginHint: string | undefined;
    ready: boolean;
    constructor(env: DappEnv, options: Web3AuthClientOptions, getChain: (chainId: string) => Chain | undefined);
    ensureSetup(): Promise<void>;
    connect(_chainIds: string | string[]): Promise<void>;
    disconnect(): Promise<void>;
    getSimpleAccount(chainId: string): Promise<{
        namespace: string;
        chainId: string;
        address: string;
        username: string;
    }>;
    getAccount(chainId: string): Promise<{
        username: string;
        algo: import("@cosmjs/proto-signing").Algo;
        pubkey: Uint8Array;
        address: string;
    }>;
    getOfflineSigner(chainId: string): Web3AuthSigner;
    getOfflineSignerAmino(chainId: string): OfflineAminoSigner;
    getOfflineSignerDirect(chainId: string): OfflineDirectSigner;
    signArbitrary(chainId: string, signer: string, data: string | Uint8Array): Promise<StdSignature>;
}
