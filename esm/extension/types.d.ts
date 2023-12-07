import { AminoSignResponse, StdSignDoc } from '@cosmjs/amino';
import { AccountData, DirectSignResponse } from '@cosmjs/proto-signing';
import { Wallet } from '@cosmos-kit/core';
import { Ecies } from '@toruslabs/eccrypto';
import { Web3AuthNoModalOptions } from '@web3auth/no-modal';
import { LOGIN_PROVIDER_TYPE, OPENLOGIN_NETWORK_TYPE } from '@web3auth/openlogin-adapter';
import { SignDoc } from 'cosmjs-types/cosmos/tx/v1beta1/tx';
export type Web3AuthWalletInfo = Wallet & {
    options: Web3AuthClientOptions;
};
export type Web3AuthLoginMethod = {
    provider: LOGIN_PROVIDER_TYPE;
    name: string;
    logo: string;
};
export type Web3AuthClientOptions = {
    loginProvider: LOGIN_PROVIDER_TYPE;
    client: {
        clientId: string;
        web3AuthNetwork: OPENLOGIN_NETWORK_TYPE;
    } & Omit<Web3AuthNoModalOptions, 'chainConfig'> & {
        chainConfig?: Omit<Web3AuthNoModalOptions['chainConfig'], 'chainNamespace'>;
    };
    forceType?: 'popup' | 'redirect';
    promptSign: PromptSign;
};
export type PromptSign = (signerAddress: string, data: SignData) => Promise<boolean>;
export type SignData = {
    type: 'direct';
    value: SignDoc;
} | {
    type: 'amino';
    value: StdSignDoc;
};
export type ToWorkerMessage = {
    type: 'init_1';
    payload: {
        publicKey: string;
    };
} | {
    type: 'init_2';
    payload: {
        encryptedPrivateKey: Ecies;
    };
} | {
    type: 'request_accounts';
    payload: {
        id: number;
        chainBech32Prefix: string;
    };
} | {
    type: 'request_sign';
    payload: {
        id: number;
        signerAddress: string;
        chainBech32Prefix: string;
        data: SignData;
    };
    signature: Uint8Array;
};
export type FromWorkerMessage = {
    type: 'ready_1';
    payload: {
        encryptedPublicKey: Ecies;
    };
} | {
    type: 'ready_2';
} | {
    type: 'init_error';
    payload: {
        error: string;
    };
} | {
    type: 'accounts';
    payload: {
        id: number;
        response: {
            type: 'success';
            accounts: AccountData[];
        } | {
            type: 'error';
            error: string;
        };
    };
    signature: Uint8Array;
} | {
    type: 'sign';
    payload: {
        id: number;
        response: {
            type: 'error';
            value: string;
        } | {
            type: 'direct';
            value: DirectSignResponse;
        } | {
            type: 'amino';
            value: AminoSignResponse;
        };
    };
    signature: Uint8Array;
};
