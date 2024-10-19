import { type Web3AuthWalletInfo } from "./types";
import { MainWalletBase } from "@cosmos-kit/core";
export declare class Web3AuthWallet extends MainWalletBase {
    constructor(walletInfo: Web3AuthWalletInfo);
    initClient(): Promise<void>;
    get walletInfo(): Web3AuthWalletInfo;
}
