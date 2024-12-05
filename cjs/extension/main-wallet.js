"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Web3AuthWallet = void 0;
const chain_wallet_1 = require("./chain-wallet");
const client_1 = require("./client");
const utils_1 = require("./utils");
const core_1 = require("@cosmos-kit/core");
const openlogin_1 = require("@toruslabs/openlogin");
const openlogin_adapter_1 = require("@web3auth/openlogin-adapter");
class Web3AuthWallet extends core_1.MainWalletBase {
    get walletInfo() {
        return this._walletInfo;
    }
    constructor(walletInfo) {
        super(walletInfo, chain_wallet_1.Web3AuthChainWallet);
    }
    initClient() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            const { options } = this.walletInfo;
            try {
                if (!options) {
                    throw new Error("Web3auth options unset");
                }
                if (typeof ((_a = options.client) === null || _a === void 0 ? void 0 : _a.clientId) !== "string") {
                    throw new TypeError("Invalid web3auth client ID");
                }
                if (typeof ((_b = options.client) === null || _b === void 0 ? void 0 : _b.web3AuthNetwork) !== "string" ||
                    !Object.values(openlogin_adapter_1.OPENLOGIN_NETWORK).includes(options.client.web3AuthNetwork)) {
                    throw new Error("Invalid web3auth network");
                }
                if (typeof options.promptSign !== "function") {
                    throw new TypeError("Invalid promptSign function");
                }
            }
            catch (error) {
                this.initClientError(error);
                return;
            }
            this.initingClient();
            try {
                if (typeof this.env === "undefined") {
                    throw new TypeError("Undefined env.");
                }
                this.initClientDone(new client_1.Web3AuthClient(this.env, options, (chainId) => {
                    var _a;
                    return (_a = this.getChainWalletList().find((chainWallet) => chainWallet.chainId === chainId)) === null || _a === void 0 ? void 0 : _a.chain;
                }));
                // Force connect to this wallet if the redirect auto connect key is set
                // and there is a wallet in the hash.
                const redirectAutoConnect = localStorage.getItem(utils_1.WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY);
                if (redirectAutoConnect !== options.loginProvider) {
                    return;
                }
                // Same logic used in `@web3auth/openlogin-adapter` >
                // `@toruslabs/openlogin` init function to determine if the adapter should
                // attempt to connect from the redirect.
                const redirectResult = (0, openlogin_1.getHashQueryParams)();
                const shouldAutoConnect = Object.keys(redirectResult).length > 0 &&
                    Boolean(redirectResult.sessionId) &&
                    !redirectResult.error;
                if (shouldAutoConnect) {
                    try {
                        yield this.connect(true);
                    }
                    catch (error) {
                        (_c = this.logger) === null || _c === void 0 ? void 0 : _c.error(error);
                    }
                }
                else {
                    // Don't try to connect again if no hash query params ready. This
                    // prevents auto-connect loops.
                    localStorage.removeItem(utils_1.WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY);
                }
            }
            catch (error) {
                this.initClientError(error);
            }
        });
    }
}
exports.Web3AuthWallet = Web3AuthWallet;
//# sourceMappingURL=main-wallet.js.map