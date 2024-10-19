import { Web3AuthWallet, web3AuthWalletInfo } from "./extension";
export const makeWeb3AuthWallets = (options) => {
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
        });
    });
};
//# sourceMappingURL=web3auth.js.map