import { Web3AuthWallet } from './extension/index.js';
import { Web3AuthClientOptions, Web3AuthLoginMethod } from './extension/types.js';
export declare const makeWeb3AuthWallets: (options: Omit<Web3AuthClientOptions, "loginProvider"> & {
    loginMethods: Web3AuthLoginMethod[];
}) => Web3AuthWallet[];
