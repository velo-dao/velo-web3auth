import { Web3AuthWallet, web3AuthWalletInfo } from "./extension"
import {
	type Web3AuthClientOptions,
	type Web3AuthLoginMethod
} from "./extension/types.js"

export const makeWeb3AuthWallets = (
	options: Omit<Web3AuthClientOptions, "loginProvider"> & {
		loginMethods: Web3AuthLoginMethod[]
	}
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
