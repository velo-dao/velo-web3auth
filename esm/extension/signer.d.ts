/// <reference types="node" />
import { Chain } from '@chain-registry/types';
import { AminoSignResponse, OfflineAminoSigner, StdSignDoc } from '@cosmjs/amino';
import { AccountData, DirectSignResponse, OfflineDirectSigner } from '@cosmjs/proto-signing';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
import { PromptSign } from './types';
export declare class Web3AuthSigner implements OfflineDirectSigner, OfflineAminoSigner {
    #private;
    chain: Chain;
    constructor(chain: Chain, worker: Worker, clientPrivateKey: Buffer, workerPublicKey: Buffer, promptSign: PromptSign);
    getAccounts(): Promise<readonly AccountData[]>;
    signDirect(signerAddress: string, signDoc: SignDoc): Promise<DirectSignResponse>;
    signAmino(signerAddress: string, signDoc: StdSignDoc): Promise<AminoSignResponse>;
}
