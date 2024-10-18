import { ICON } from "../constant"
import { type Wallet } from "@cosmos-kit/core"

export const web3AuthWalletInfo: Wallet = {
	logo: ICON,
	mobileDisabled: false,
	mode: "extension",
	name: "web3auth",
	prettyName: "Web3Auth",
	rejectMessage: {
		source: "Request rejected"
	}
}
