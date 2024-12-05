import { type Web3AuthWalletInfo } from "./types";
import { MainWalletBase } from "@cosmos-kit/core";
export declare class Web3AuthWallet extends MainWalletBase {
    get walletInfo(): Web3AuthWalletInfo;
    constructor(walletInfo: Web3AuthWalletInfo);
    initClient(): Promise<void>;
}
