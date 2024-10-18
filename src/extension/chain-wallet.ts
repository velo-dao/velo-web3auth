import {
	type ChainRecord,
	ChainWalletBase,
	type Wallet
} from "@cosmos-kit/core"

export class Web3AuthChainWallet extends ChainWalletBase {
	// eslint-disable-next-line @typescript-eslint/no-useless-constructor
	constructor(walletInfo: Wallet, chainInfo: ChainRecord) {
		super(walletInfo, chainInfo)
	}
}
