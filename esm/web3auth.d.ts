import { Web3AuthWallet } from "./extension";
import { type Web3AuthClientOptions, type Web3AuthLoginMethod } from "./extension/types";
export declare const makeWeb3AuthWallets: (options: {
    loginMethods: Web3AuthLoginMethod[];
} & Omit<Web3AuthClientOptions, "loginProvider">) => Web3AuthWallet[];
