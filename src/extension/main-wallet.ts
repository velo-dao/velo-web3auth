import { Web3AuthChainWallet } from "./chain-wallet"
import { Web3AuthClient } from "./client"
import { type Web3AuthWalletInfo } from "./types"
import { WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY } from "./utils"
import { MainWalletBase } from "@cosmos-kit/core"
import { getHashQueryParams } from "@web3auth/auth"
import { WEB3AUTH_NETWORK } from "@web3auth/auth-adapter"

export class Web3AuthWallet extends MainWalletBase {
	constructor(walletInfo: Web3AuthWalletInfo) {
		super(walletInfo, Web3AuthChainWallet)
	}

	async initClient() {
		const { options } = this.walletInfo
		try {
			if (!options) {
				throw new Error("Web3auth options unset")
			}

			if (typeof options.client?.clientId !== "string") {
				throw new TypeError("Invalid web3auth client ID")
			}

			if (
				typeof options.client?.web3AuthNetwork !== "string" ||
				!Object.values(WEB3AUTH_NETWORK).includes(
					options.client.web3AuthNetwork
				)
			) {
				throw new Error("Invalid web3auth network")
			}

			if (typeof options.promptSign !== "function") {
				throw new TypeError("Invalid promptSign function")
			}
		} catch (error) {
			if (error instanceof Error) {
				this.initClientError(error)
			}

			return
		}

		this.initingClient()

		try {
			if (typeof this.env === "undefined") {
				throw new TypeError("Undefined env.")
			}

			this.initClientDone(
				new Web3AuthClient(
					this.env,
					options,
					(chainId) =>
						this.getChainWalletList().find(
							(chainWallet) => chainWallet.chainId === chainId
						)?.chain
				)
			)

			const redirectAutoConnect = localStorage.getItem(
				WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY
			)
			if (redirectAutoConnect !== options.loginProvider) {
				return
			}

			const redirectResult = getHashQueryParams()
			const shouldAutoConnect =
				Object.keys(redirectResult).length > 0 &&
				Boolean(redirectResult.sessionId) &&
				!redirectResult.error

			if (shouldAutoConnect) {
				try {
					await this.connect(true)
				} catch (error) {
					this.logger?.error(error)
				}
			} else {
				localStorage.removeItem(WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY)
			}
		} catch (error) {
			if (error instanceof Error) {
				this.initClientError(error)
			}
		}
	}

	get walletInfo(): Web3AuthWalletInfo {
		return this._walletInfo as Web3AuthWalletInfo
	}
}
