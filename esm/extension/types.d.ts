import { type AminoSignResponse, type StdSignDoc } from "@cosmjs/amino";
import { type AccountData, type DirectSignResponse } from "@cosmjs/proto-signing";
import { type Wallet } from "@cosmos-kit/core";
import { type Ecies } from "@toruslabs/eccrypto";
import { type LOGIN_PROVIDER_TYPE } from "@web3auth/auth-adapter";
import { type WEB3AUTH_NETWORK_TYPE, type Web3AuthNoModalOptions } from "@web3auth/base";
import { type SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx";
export type Web3AuthWalletInfo = {
    options: Web3AuthClientOptions;
} & Wallet;
export type Web3AuthLoginMethod = {
    logo: string;
    name: string;
    provider: LOGIN_PROVIDER_TYPE;
};
export type Web3AuthClientOptions = {
    client: {
        chainConfig?: Omit<Web3AuthNoModalOptions["chainConfig"], "chainNamespace">;
    } & {
        clientId: string;
        web3AuthNetwork: WEB3AUTH_NETWORK_TYPE;
    } & Omit<Web3AuthNoModalOptions, "chainConfig">;
    forceType?: "popup" | "redirect";
    loginProvider: LOGIN_PROVIDER_TYPE;
    promptSign: PromptSign;
};
export type PromptSign = (signerAddress: string, data: SignData) => Promise<boolean>;
export type SignData = {
    type: "amino";
    value: StdSignDoc;
} | {
    type: "direct";
    value: SignDoc;
};
export type ToWorkerMessage = {
    payload: {
        chainBech32Prefix: string;
        data: SignData;
        id: number;
        signerAddress: string;
    };
    signature: Uint8Array;
    type: "request_sign";
} | {
    payload: {
        chainBech32Prefix: string;
        id: number;
    };
    type: "request_accounts";
} | {
    payload: {
        encryptedPrivateKey: Ecies;
    };
    type: "init_2";
} | {
    payload: {
        publicKey: string;
    };
    type: "init_1";
};
export type FromWorkerMessage = {
    payload: {
        encryptedPublicKey: Ecies;
    };
    type: "ready_1";
} | {
    payload: {
        error: string;
    };
    type: "init_error";
} | {
    payload: {
        id: number;
        response: {
            accounts: AccountData[];
            type: "success";
        } | {
            error: string;
            type: "error";
        };
    };
    signature: Uint8Array;
    type: "accounts";
} | {
    payload: {
        id: number;
        response: {
            type: "amino";
            value: AminoSignResponse;
        } | {
            type: "direct";
            value: DirectSignResponse;
        } | {
            type: "error";
            value: string;
        };
    };
    signature: Uint8Array;
    type: "sign";
} | {
    type: "ready_2";
};
