import { type AminoSignResponse, type StdSignDoc } from "@cosmjs/amino"
import {
	type AccountData,
	type DirectSignResponse
} from "@cosmjs/proto-signing"
import { type Wallet } from "@cosmos-kit/core"
import { type Ecies } from "@toruslabs/eccrypto"
import { type Web3AuthNoModalOptions } from "@web3auth/base"
import {
	type LOGIN_PROVIDER_TYPE,
	type OPENLOGIN_NETWORK_TYPE
} from "@web3auth/openlogin-adapter"
import { type SignDoc } from "cosmjs-types/cosmos/tx/v1beta1/tx"
// Message the worker sends to the main thread.
export type FromWorkerMessage =
	| {
			payload: {
				encryptedPublicKey: Ecies
			}
			type: "ready_1"
	  }
	| {
			payload: {
				error: string
			}
			type: "init_error"
	  }
	| {
			payload: {
				id: number
				response:
					| {
							accounts: AccountData[]
							type: "success"
					  }
					| {
							error: string
							type: "error"
					  }
			}
			signature: Uint8Array
			type: "accounts"
	  }
	| {
			payload: {
				id: number
				response:
					| {
							type: "amino"
							value: AminoSignResponse
					  }
					| {
							type: "direct"
							value: DirectSignResponse
					  }
					| {
							type: "error"
							value: string
					  }
			}
			signature: Uint8Array
			type: "sign"
	  }
	| {
			type: "ready_2"
	  }

export type PromptSign = (
	signerAddress: string,
	data: SignData
) => Promise<boolean>

export type SignData =
	| {
			type: "amino"
			value: StdSignDoc
	  }
	| {
			type: "direct"
			value: SignDoc
	  }

// Message the worker expects to receive.
export type ToWorkerMessage =
	| {
			payload: {
				chainBech32Prefix: string
				data: SignData
				id: number
				signerAddress: string
			}
			signature: Buffer
			type: "request_sign"
	  }
	| {
			payload: {
				chainBech32Prefix: string
				id: number
			}
			type: "request_accounts"
	  }
	| {
			payload: {
				encryptedPrivateKey: Ecies
			}
			type: "init_2"
	  }
	| {
			payload: {
				publicKey: string
			}
			type: "init_1"
	  }

export type Web3AuthClientOptions = {
	// Web3Auth client options.
	client: Omit<Web3AuthNoModalOptions, "chainConfig"> & {
		chainConfig?: Omit<Web3AuthNoModalOptions["chainConfig"], "chainNamespace">
	} & {
		clientId: string
		web3AuthNetwork: OPENLOGIN_NETWORK_TYPE
	}

	// Mobile devices block popups by default, so the default behavior is to use
	// the redirect method to sign-in on mobile, and the popup method on desktop.
	// The popup is safer, but mobile browsers tend to have less extensions (and
	// browser extensions are the main security concern for the redirect method).
	// Forcing popup means that the popup method will be used on mobile as well.
	forceType?: "popup" | "redirect"

	loginProvider: LOGIN_PROVIDER_TYPE

	// Function to prompt the user to sign a transaction.
	promptSign: PromptSign
}

export type Web3AuthLoginMethod = {
	logo: string
	name: string
	provider: LOGIN_PROVIDER_TYPE
}

export type Web3AuthWalletInfo = Wallet & {
	options: Web3AuthClientOptions
}
