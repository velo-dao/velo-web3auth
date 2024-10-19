import { sha256 } from "@cosmjs/crypto";
import { toUtf8 } from "@cosmjs/encoding";
import { decrypt as ecdecrypt } from "@toruslabs/eccrypto";
import { AuthAdapter, UX_MODE } from "@web3auth/auth-adapter";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, WALLET_ADAPTERS } from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { getUserLocales } from "get-user-locale";
// If we connect to the Web3Auth client via redirect, set this key in
// localStorage to indicate that we should try to reconnect to this wallet
// after the redirect. This should be implemented by the WalletManagerProvider.
export const WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY = "__cosmos-kit_web3auth_redirect_auto_connect";
// In case these get overwritten by an attacker.
const postMessage = typeof Worker !== "undefined" ? Worker.prototype.postMessage : undefined;
const addEventListener = typeof Worker !== "undefined" ? Worker.prototype.addEventListener : undefined;
const removeEventListener = typeof Worker !== "undefined"
    ? Worker.prototype.removeEventListener
    : undefined;
// Listen for a message and remove the listener if the callback returns true or
// if it throws an error.
export const listenOnce = (worker, callback) => {
    const listener = async ({ data }) => {
        let remove;
        try {
            remove = await callback(data);
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
            remove = true;
        }
        if (remove) {
            removeEventListener?.call(worker, "message", listener);
        }
    };
    addEventListener?.call(worker, "message", listener);
};
// Send message to worker and listen for a response. Returns a promise that
// resolves when the callback returns true and rejects if it throws an error.
export const sendAndListenOnce = (worker, message, callback) => new Promise((resolve, reject) => {
    listenOnce(worker, async (data) => {
        try {
            if (await callback(data)) {
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
    });
    postMessage?.call(worker, message);
});
export const decrypt = async (privateKey, { ciphertext, ephemPublicKey, iv, mac }) => await ecdecrypt(Buffer.from(privateKey), 
// Convert Uint8Array to Buffer.
{
    ciphertext: Buffer.from(ciphertext),
    ephemPublicKey: Buffer.from(ephemPublicKey),
    iv: Buffer.from(iv),
    mac: Buffer.from(mac)
});
// Used for signing and verifying objects.
export const hashObject = (object) => {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const replacer = (_, value) => {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    };
    return Buffer.from(sha256(toUtf8(JSON.stringify(object, replacer))));
};
export const connectClientAndProvider = async (isMobile, options, loginHint, { dontAttemptLogin = false } = {}) => {
    const chainConfig = {
        blockExplorerUrl: "other",
        chainId: "other",
        decimals: 6,
        displayName: "other",
        rpcTarget: "other",
        ticker: "other",
        tickerName: "other",
        ...options.client.chainConfig,
        chainNamespace: CHAIN_NAMESPACES.OTHER
    };
    const client = new Web3AuthNoModal({
        ...options.client,
        chainConfig
    });
    // Popups are blocked by default on mobile browsers, so use redirect. Popup is
    // safer for desktop browsers, so use that if not mobile.
    const uxMode = options.forceType === "redirect" || (isMobile && !options.forceType)
        ? UX_MODE.REDIRECT
        : UX_MODE.POPUP;
    // If using redirect method while trying to login, set localStorage key
    // indicating that we should try to reconnect to this wallet after the
    // redirect on library init.
    const usingRedirect = uxMode === UX_MODE.REDIRECT && !dontAttemptLogin;
    if (usingRedirect) {
        localStorage.setItem(WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY, options.loginProvider);
    }
    const userLocale = getUserLocales({
        fallbackLocale: "en-US",
        useFallbackLocale: false
    });
    const filteredLocales = userLocale.filter((locale) => !locale.includes("-"));
    const privateKeyProvider = new CommonPrivateKeyProvider({
        config: {
            chainConfig,
            skipLookupNetwork: true
        }
    });
    const authAdapter = new AuthAdapter({
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
    client.configureAdapter(authAdapter);
    await client.init();
    let provider = client.connected ? client.provider : null;
    if (!client.connected && !dontAttemptLogin) {
        try {
            provider = await client.connectTo(WALLET_ADAPTERS.AUTH, {
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
        if (client.status === ADAPTER_STATUS.CONNECTED) {
            // On successful connection from a redirect, remove the localStorage key
            // so we do not attempt to auto connect on the next page load.
            localStorage.removeItem(WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY);
        }
        else {
            // If not yet connected but redirecting, hang to give the page time to
            // redirect without throwing any errors. After 30 seconds, throw a
            // timeout error because it should definitely have redirected by then.
            // eslint-disable-next-line promise/param-names
            await new Promise((_, reject) => {
                setTimeout(() => reject(new Error("Redirect timed out.")), 30_000);
            });
        }
    }
    return {
        client,
        provider
    };
};
//# sourceMappingURL=utils.js.map