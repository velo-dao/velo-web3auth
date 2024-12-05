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
exports.connectClientAndProvider = exports.hashObject = exports.decrypt = exports.sendAndListenOnce = exports.listenOnce = exports.WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY = void 0;
const crypto_1 = require("@cosmjs/crypto");
const encoding_1 = require("@cosmjs/encoding");
const eccrypto_1 = require("@toruslabs/eccrypto");
const base_1 = require("@web3auth/base");
const base_provider_1 = require("@web3auth/base-provider");
const no_modal_1 = require("@web3auth/no-modal");
const openlogin_adapter_1 = require("@web3auth/openlogin-adapter");
const get_user_locale_1 = require("get-user-locale");
// If we connect to the Web3Auth client via redirect, set this key in
// localStorage to indicate that we should try to reconnect to this wallet
// after the redirect. This should be implemented by the WalletManagerProvider.
exports.WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY = "__cosmos-kit_web3auth_redirect_auto_connect";
// In case these get overwritten by an attacker.
const postMessage = typeof Worker === "undefined" ? undefined : Worker.prototype.postMessage;
const addEventListener = typeof Worker === "undefined" ? undefined : Worker.prototype.addEventListener;
const removeEventListener = typeof Worker === "undefined"
    ? undefined
    : Worker.prototype.removeEventListener;
// Listen for a message and remove the listener if the callback returns true or
// if it throws an error.
const listenOnce = (worker, callback) => {
    const listener = (_a) => __awaiter(void 0, [_a], void 0, function* ({ data }) {
        let remove;
        try {
            remove = yield callback(data);
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
            remove = true;
        }
        if (remove) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            removeEventListener === null || removeEventListener === void 0 ? void 0 : removeEventListener.call(worker, "message", listener);
        }
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addEventListener === null || addEventListener === void 0 ? void 0 : addEventListener.call(worker, "message", listener);
};
exports.listenOnce = listenOnce;
// Send message to worker and listen for a response. Returns a promise that
// resolves when the callback returns true and rejects if it throws an error.
const sendAndListenOnce = (worker, message, callback) => new Promise((resolve, reject) => {
    (0, exports.listenOnce)(worker, (data) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (yield callback(data)) {
                resolve();
                return true;
            }
            else {
                return false;
            }
        }
        catch (error) {
            reject(error);
            return true;
        }
    }));
    postMessage === null || postMessage === void 0 ? void 0 : postMessage.call(worker, message);
});
exports.sendAndListenOnce = sendAndListenOnce;
const decrypt = (privateKey_1, _a) => __awaiter(void 0, [privateKey_1, _a], void 0, function* (privateKey, { ciphertext, ephemPublicKey, iv, mac }) {
    return yield (0, eccrypto_1.decrypt)(Buffer.from(privateKey), 
    // Convert Uint8Array to Buffer.
    {
        ciphertext: Buffer.from(ciphertext),
        ephemPublicKey: Buffer.from(ephemPublicKey),
        iv: Buffer.from(iv),
        mac: Buffer.from(mac)
    });
});
exports.decrypt = decrypt;
// Used for signing and verifying objects.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const hashObject = (object) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, unicorn/consistent-function-scoping
    const replacer = (_, value) => {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    };
    return Buffer.from((0, crypto_1.sha256)((0, encoding_1.toUtf8)(JSON.stringify(object, replacer))));
};
exports.hashObject = hashObject;
const connectClientAndProvider = (isMobile_1, options_1, loginHint_1, ...args_1) => __awaiter(void 0, [isMobile_1, options_1, loginHint_1, ...args_1], void 0, function* (isMobile, options, loginHint, { dontAttemptLogin = false } = {}) {
    const chainConfig = Object.assign(Object.assign({ blockExplorerUrl: "other", chainId: "other", decimals: 6, displayName: "other", rpcTarget: "other", ticker: "other", tickerName: "other" }, options.client.chainConfig), { chainNamespace: base_1.CHAIN_NAMESPACES.OTHER });
    const client = new no_modal_1.Web3AuthNoModal(Object.assign(Object.assign({}, options.client), { chainConfig }));
    // Popups are blocked by default on mobile browsers, so use redirect. Popup is
    // safer for desktop browsers, so use that if not mobile.
    const uxMode = options.forceType === "redirect" || (isMobile && !options.forceType)
        ? openlogin_adapter_1.UX_MODE.REDIRECT
        : openlogin_adapter_1.UX_MODE.POPUP;
    // If using redirect method while trying to login, set localStorage key
    // indicating that we should try to reconnect to this wallet after the
    // redirect on library init.
    const usingRedirect = uxMode === openlogin_adapter_1.UX_MODE.REDIRECT && !dontAttemptLogin;
    if (usingRedirect) {
        localStorage.setItem(exports.WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY, options.loginProvider);
    }
    const userLocale = (0, get_user_locale_1.getUserLocales)({
        fallbackLocale: "en-US",
        useFallbackLocale: false
    });
    const filteredLocales = userLocale.filter((locale) => !locale.includes("-"));
    const privateKeyProvider = new base_provider_1.CommonPrivateKeyProvider({
        config: {
            chainConfig,
            skipLookupNetwork: true
        }
    });
    const openloginAdapter = new openlogin_adapter_1.OpenloginAdapter({
        adapterSettings: {
            uxMode,
            whiteLabel: {
                appName: "Velo",
                defaultLanguage: filteredLocales[0],
                logoDark: "https://app.velo.space/assets/logo_transparent.png",
                logoLight: "https://app.velo.space/assets/logo_transparent.png",
                mode: "auto",
                theme: {
                    onPrimary: "#ffffff",
                    primary: "#9866DB"
                },
                // appUrl: 'https://app.velo.space',
                useLogoLoader: true
            }
        },
        loginSettings: {
            extraLoginOptions: {
                login_hint: loginHint // email to send the OTP to or phone number to send sms to
                // domain: "https://app.velo.space",
            },
            mfaLevel: "mandatory"
        },
        privateKeyProvider
    });
    client.configureAdapter(openloginAdapter);
    yield client.init();
    let provider = client.connected ? client.provider : null;
    if (!client.connected && !dontAttemptLogin) {
        try {
            provider = yield client.connectTo(base_1.WALLET_ADAPTERS.OPENLOGIN, {
                extraLoginOptions: {
                    login_hint: loginHint // email to send the OTP to or phone number to send sms to
                },
                loginProvider: options.loginProvider
            });
        }
        catch (error) {
            // Unnecessary error thrown during redirect, so log and ignore it.
            if (usingRedirect &&
                error instanceof Error &&
                error.message.includes("null")) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
            else {
                // Rethrow all other relevant errors.
                throw error;
            }
        }
    }
    if (usingRedirect) {
        if (client.status === base_1.ADAPTER_STATUS.CONNECTED) {
            // On successful connection from a redirect, remove the localStorage key
            // so we do not attempt to auto connect on the next page load.
            localStorage.removeItem(exports.WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY);
        }
        else {
            // If not yet connected but redirecting, hang to give the page time to
            // redirect without throwing any errors. After 30 seconds, throw a
            // timeout error because it should definitely have redirected by then.
            // eslint-disable-next-line promise/param-names
            yield new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Redirect timed out.")), 30000);
            });
        }
    }
    return {
        client,
        provider
    };
});
exports.connectClientAndProvider = connectClientAndProvider;
//# sourceMappingURL=utils.js.map