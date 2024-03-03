import { sha256 } from '@cosmjs/crypto';
import { toUtf8 } from '@cosmjs/encoding';
import { Ecies, decrypt as ecdecrypt } from '@toruslabs/eccrypto';
import {
  ADAPTER_STATUS,
  CHAIN_NAMESPACES,
  CustomChainConfig,
  SafeEventEmitterProvider,
  WALLET_ADAPTERS,
} from '@web3auth/base';
import { CommonPrivateKeyProvider } from '@web3auth/base-provider';
import { Web3AuthNoModal } from '@web3auth/no-modal';
import {
  LANGUAGE_TYPE,
  OpenloginAdapter,
  UX_MODE,
} from '@web3auth/openlogin-adapter';
import { getUserLocales } from 'get-user-locale';

import {
  FromWorkerMessage,
  ToWorkerMessage,
  Web3AuthClientOptions,
} from './types';

// If we connect to the Web3Auth client via redirect, set this key in
// localStorage to indicate that we should try to reconnect to this wallet
// after the redirect. This should be implemented by the WalletManagerProvider.
export const WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY =
  '__cosmos-kit_web3auth_redirect_auto_connect';

// In case these get overwritten by an attacker.
const postMessage =
  typeof Worker !== 'undefined' ? Worker.prototype.postMessage : undefined;
const addEventListener =
  typeof Worker !== 'undefined' ? Worker.prototype.addEventListener : undefined;
const removeEventListener =
  typeof Worker !== 'undefined'
    ? Worker.prototype.removeEventListener
    : undefined;

// Listen for a message and remove the listener if the callback returns true or
// if it throws an error.
export const listenOnce = (
  worker: Worker,
  callback: (message: FromWorkerMessage) => boolean | Promise<boolean>
) => {
  const listener = async ({ data }: MessageEvent<FromWorkerMessage>) => {
    let remove;
    try {
      remove = await callback(data);
    } catch (error) {
      console.error(error);
      remove = true;
    }

    if (remove) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      removeEventListener?.call(worker, 'message', listener as any);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addEventListener?.call(worker, 'message', listener as any);
};

// Send message to worker and listen for a response. Returns a promise that
// resolves when the callback returns true and rejects if it throws an error.
export const sendAndListenOnce = (
  worker: Worker,
  message: ToWorkerMessage,
  callback: (message: FromWorkerMessage) => boolean | Promise<boolean>
): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    listenOnce(worker, async (data) => {
      try {
        if (await callback(data)) {
          resolve();
          return true;
        } else {
          return false;
        }
      } catch (err) {
        reject(err);
        return true;
      }
    });

    postMessage?.call(worker, message);
  });

export const decrypt = async (
  privateKey: Uint8Array | Buffer,
  { iv, ephemPublicKey, ciphertext, mac }: Ecies
): Promise<Buffer> =>
  await ecdecrypt(
    Buffer.from(privateKey),
    // Convert Uint8Array to Buffer.
    {
      iv: Buffer.from(iv),
      ephemPublicKey: Buffer.from(ephemPublicKey),
      ciphertext: Buffer.from(ciphertext),
      mac: Buffer.from(mac),
    }
  );

// Used for signing and verifying objects.
export const hashObject = (object: unknown): Buffer =>
  Buffer.from(sha256(toUtf8(JSON.stringify(object))));

export const connectClientAndProvider = async (
  isMobile: boolean,
  options: Web3AuthClientOptions,
  loginHint?: string,
  {
    // If no login provider already connected (cached), don't attempt to login
    // by showing the popup auth flow. This is useful for connecting just to
    // logout of the session, not prompting to login if already logged out.
    dontAttemptLogin = false,
  } = {}
): Promise<{
  client: Web3AuthNoModal;
  provider: SafeEventEmitterProvider | null;
}> => {
  const chainConfig: CustomChainConfig = {
    chainId: 'other',
    rpcTarget: 'other',
    displayName: 'other',
    blockExplorer: 'other',
    decimals: 6,
    ticker: 'other',
    tickerName: 'other',
    ...options.client.chainConfig,
    chainNamespace: CHAIN_NAMESPACES.OTHER,
  };
  const client = new Web3AuthNoModal({
    ...options.client,
    chainConfig,
  });

  // Popups are blocked by default on mobile browsers, so use redirect. Popup is
  // safer for desktop browsers, so use that if not mobile.
  const uxMode =
    options.forceType === 'redirect' || (isMobile && !options.forceType)
      ? UX_MODE.REDIRECT
      : UX_MODE.POPUP;
  // If using redirect method while trying to login, set localStorage key
  // indicating that we should try to reconnect to this wallet after the
  // redirect on library init.
  const usingRedirect = uxMode === UX_MODE.REDIRECT && !dontAttemptLogin;
  if (usingRedirect) {
    localStorage.setItem(
      WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY,
      options.loginProvider
    );
  }

  const userLocale = getUserLocales({
    fallbackLocale: 'en-US',
    useFallbackLocale: false,
  });

  const filteredLocales = userLocale.filter(
    (locale) => !locale.includes('-')
  ) as LANGUAGE_TYPE[];

  const privateKeyProvider = new CommonPrivateKeyProvider({
    config: {
      chainConfig,
    },
  });

  const openloginAdapter = new OpenloginAdapter({
    privateKeyProvider,
    loginSettings: {
      extraLoginOptions: {
        login_hint: loginHint, // email to send the OTP to or phone number to send sms to
      },
      mfaLevel: 'mandatory',
    },
    adapterSettings: {
      uxMode,
      whiteLabel: {
        appName: 'Velo',
        appUrl: 'https://velo.space',
        useLogoLoader: false,
        logoDark: 'https://app.velo.space/assets/logo_transparent.svg',
        logoLight: 'https://app.velo.space/assets/logo_transparent.svg',
        mode: 'dark',
        defaultLanguage: filteredLocales[0],
        theme: {
          primary: '#23E9C4',
          error: '#FF9E60',
          green: '#2FAE3B',
          gray: '#3d538c',
          info: '#2975CB',
          red: '#FA5861',
          success: '#5CD367',
          warning: '#FF9E60',
          white: '#f5f5f5',
        },
      },
      mfaSettings: {
        backUpShareFactor: {
          enable: true,
          priority: 0,
          mandatory: true,
        },
        socialBackupFactor: {
          enable: true,
          priority: 1,
          mandatory: false,
        },
        deviceShareFactor: {
          enable: false,
          priority: 2,
          mandatory: false,
        },
        passwordFactor: {
          enable: false,
          priority: 3,
          mandatory: false,
        },
      },
      // Setting both to empty strings prevents the popup from opening when
      // attempted, ensuring no login attempt is made. Essentially, this makes
      // the `connectTo` method called on the client below throw an error if a
      // session is not already logged in and cached.
      ...(dontAttemptLogin && {
        _startUrl: '',
        _popupUrl: '',
      }),
    },
  });

  client.configureAdapter(openloginAdapter);

  // if (loginType === 'metamask') {
  //   const metamaskAdapter = new MetamaskAdapter({
  //     clientId: options.client.clientId,
  //     sessionTime: 3600, // 1 hour in seconds
  //     web3AuthNetwork: options.client.web3AuthNetwork,
  //     chainConfig,
  //   });

  //   client.configureAdapter(metamaskAdapter);
  // }

  // if (loginType === 'coinbase') {
  //   const coinbaseAdapter = new CoinbaseAdapter({
  //     clientId: options.client.clientId,
  //     sessionTime: 3600, // 1 hour in seconds
  //     web3AuthNetwork: options.client.web3AuthNetwork,
  //     chainConfig,
  //   });

  //   client.configureAdapter(coinbaseAdapter);
  // }

  await client.init();

  let provider = client.connected ? client.provider : null;

  if (!client.connected) {
    try {
      provider = await client.connectTo(WALLET_ADAPTERS.OPENLOGIN, {
        loginProvider: options.loginProvider,
        extraLoginOptions: {
          login_hint: loginHint, // email to send the OTP to
        },
      });
    } catch (err) {
      // Unnecessary error thrown during redirect, so log and ignore it.
      if (
        usingRedirect &&
        err instanceof Error &&
        err.message.includes('null')
      ) {
        console.error(err);
      } else {
        // Rethrow all other relevant errors.
        throw err;
      }
    }
  }

  if (usingRedirect) {
    if (client.status === ADAPTER_STATUS.CONNECTED) {
      // On successful connection from a redirect, remove the localStorage key
      // so we do not attempt to auto connect on the next page load.
      localStorage.removeItem(WEB3AUTH_REDIRECT_AUTO_CONNECT_KEY);
    } else {
      // If not yet connected but redirecting, hang to give the page time to
      // redirect without throwing any errors. After 30 seconds, throw a
      // timeout error because it should definitely have redirected by then.
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Redirect timed out.')), 30000)
      );
    }
  }

  return {
    client,
    provider,
  };
};
