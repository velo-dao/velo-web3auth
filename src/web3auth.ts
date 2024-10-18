import { Web3AuthWallet, web3AuthWalletInfo } from "./extension"
import {
	type Web3AuthClientOptions,
	type Web3AuthLoginMethod
} from "./extension/types"

export const makeWeb3AuthWallets = (
	options: {
		loginMethods: Web3AuthLoginMethod[]
	} & Omit<Web3AuthClientOptions, "loginProvider">
) => {
	return options.loginMethods.map(({ logo, name, provider }) => {
		return new Web3AuthWallet({
			...web3AuthWalletInfo,
			logo,
			name: web3AuthWalletInfo.name + "_" + provider,
			options: {
				...options,
				loginProvider: provider
			},
			prettyName: name
		})
	})
}
