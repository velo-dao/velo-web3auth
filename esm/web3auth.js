import { Web3AuthWallet, web3AuthWalletInfo } from './extension/index.js';
export const makeWeb3AuthWallets = (options) => {
    return options.loginMethods.map(({ provider, name, logo }) => {
        return new Web3AuthWallet({
            ...web3AuthWalletInfo,
            name: web3AuthWalletInfo.name + '_' + provider,
            prettyName: name,
            logo,
            options: {
                ...options,
                loginProvider: provider,
            },
        });
    });
};
//# sourceMappingURL=web3auth.js.map