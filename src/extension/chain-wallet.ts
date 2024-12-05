import {
	type ChainRecord,
	ChainWalletBase,
	type Wallet
} from "@cosmos-kit/core"

export class Web3AuthChainWallet extends ChainWalletBase {
	constructor(walletInfo: Wallet, chainInfo: ChainRecord) {
		super(walletInfo, chainInfo)
	}
}
