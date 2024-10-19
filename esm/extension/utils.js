import { sha256 } from "@cosmjs/crypto";
import { toUtf8 } from "@cosmjs/encoding";
import { decrypt as ecdecrypt } from "@toruslabs/eccrypto";
import { AuthAdapter, UX_MODE } from "@web3auth/auth-adapter";
import { ADAPTER_STATUS, CHAIN_NAMESPACES, WALLET_ADAPTERS } from "@web3auth/base";
import { CommonPrivateKeyProvider } from "@web3auth/base-provider";
import { Web3AuthNoModal } from "@web3auth/no-modal";
import { getUserLocales } from "get-user-locale";
export const WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY = "__cosmos-kit_web3auth_redirect_auto_connect";
const postMessage = typeof Worker !== "undefined" ? Worker.prototype.postMessage : undefined;
const addEventListener = typeof Worker !== "undefined" ? Worker.prototype.addEventListener : undefined;
const removeEventListener = typeof Worker !== "undefined"
    ? Worker.prototype.removeEventListener
    : undefined;
export const listenOnce = (worker, callback) => {
    const listener = async ({ data }) => {
        let remove;
        try {
            remove = await callback(data);
        }
        catch (error) {
            console.error(error);
            remove = true;
        }
        if (remove) {
            removeEventListener?.call(worker, "message", listener);
        }
    };
    addEventListener?.call(worker, "message", listener);
};
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
export const decrypt = async (privateKey, { ciphertext, ephemPublicKey, iv, mac }) => await ecdecrypt(Buffer.from(privateKey), {
    ciphertext: Buffer.from(ciphertext),
    ephemPublicKey: Buffer.from(ephemPublicKey),
    iv: Buffer.from(iv),
    mac: Buffer.from(mac)
});
export const hashObject = (object) => {
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
    const uxMode = options.forceType === "redirect" || (isMobile && !options.forceType)
        ? UX_MODE.REDIRECT
        : UX_MODE.POPUP;
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
                useLogoLoader: true
            }
        },
        loginSettings: {
            extraLoginOptions: {
                login_hint: loginHint
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
                    login_hint: loginHint
                },
                loginProvider: options.loginProvider
            });
        }
        catch (error) {
            if (usingRedirect &&
                error instanceof Error &&
                error.message.includes("null")) {
                console.error(error);
            }
            else {
                throw error;
            }
        }
    }
    if (usingRedirect) {
        if (client.status === ADAPTER_STATUS.CONNECTED) {
            localStorage.removeItem(WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY);
        }
        else {
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