import { MainWalletBase } from '@cosmos-kit/core';
import { Web3AuthWalletInfo } from './types';
export declare class Web3AuthWallet extends MainWalletBase {
    constructor(walletInfo: Web3AuthWalletInfo);
    get walletInfo(): Web3AuthWalletInfo;
    initClient(): Promise<void>;
}
