"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeWeb3AuthWallets = void 0;
const index_js_1 = require("./extension/index.js");
const makeWeb3AuthWallets = (options) => {
    return options.loginMethods.map(({ provider, name, logo }) => {
        return new index_js_1.Web3AuthWallet(Object.assign(Object.assign({}, index_js_1.web3AuthWalletInfo), { name: index_js_1.web3AuthWalletInfo.name + '_' + provider, prettyName: name, logo, options: Object.assign(Object.assign({}, options), { loginProvider: provider }) }));
    });
};
exports.makeWeb3AuthWallets = makeWeb3AuthWallets;
//# sourceMappingURL=web3auth.js.map