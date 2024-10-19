import { type PromptSign } from "./types";
import { type Chain } from "@chain-registry/types";
import { type AminoSignResponse, type OfflineAminoSigner, type StdSignDoc } from "@cosmjs/amino";
import { type AccountData, type DirectSignResponse, type OfflineDirectSigner } from "@cosmjs/proto-signing";
import { type SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";
export declare class Web3AuthSigner implements OfflineDirectSigner, OfflineAminoSigner {
    #private;
    chain: Chain;
    constructor(chain: Chain, worker: Worker, clientPrivateKey: Buffer, workerPublicKey: Buffer, promptSign: PromptSign);
    getAccounts(): Promise<readonly AccountData[]>;
    signAmino(signerAddress: string, signDoc: StdSignDoc): Promise<AminoSignResponse>;
    signDirect(signerAddress: string, signDoc: SignDoc): Promise<DirectSignResponse>;
}
