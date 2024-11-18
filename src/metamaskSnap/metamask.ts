import type {
  EIP6963AnnounceProviderEvent,
  MetaMaskInpageProvider,
} from '@metamask/providers';

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider & {
      detected?: MetaMaskInpageProvider[];
      providers?: MetaMaskInpageProvider[];
    };
  }
}

const PROVIDER_DETECTION_TIMEOUT = 500;

/**
 * Check if a provider supports snaps by calling `wallet_getSnaps`.
 *
 * @param provider - The provider to test for snaps support
 * @returns A promise that resolves to true if snaps are supported
 */
export async function hasSnapsSupport(
  provider?: MetaMaskInpageProvider,
): Promise<boolean> {
  if (!provider) {
    return false;
  }

  try {
    await provider.request({
      method: 'wallet_getSnaps',
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get a MetaMask provider using EIP6963 specification.
 *
 * @returns Promise resolving to MetaMask provider or null if not found within timeout
 */
export async function getMetaMaskEIP6963Provider(): Promise<MetaMaskInpageProvider | null> {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      cleanup();
      resolve(null);
    }, PROVIDER_DETECTION_TIMEOUT);

    function cleanup() {
      window.removeEventListener(
        'eip6963:announceProvider',
        handleAnnouncement,
      );
      clearTimeout(timeout);
    }

    function handleAnnouncement({ detail }: EIP6963AnnounceProviderEvent) {
      if (detail.info.rdns.includes('io.metamask')) {
        cleanup();
        resolve(detail.provider);
      }
    }

    window.addEventListener('eip6963:announceProvider', handleAnnouncement);
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  });
}

/**
 * Check providers from an array for snaps support
 *
 * @param providers - Array of providers to check
 * @returns First provider with snaps support or null
 */
async function findProviderWithSnaps(
  providers?: MetaMaskInpageProvider[],
): Promise<MetaMaskInpageProvider | null> {
  if (!providers?.length) {
    return null;
  }

  for (const provider of providers) {
    if (await hasSnapsSupport(provider)) {
      return provider;
    }
  }
  return null;
}

/**
 * Get a MetaMask provider that supports snaps.
 * Checks multiple provider sources in order of priority.
 *
 * @returns Promise resolving to a compatible provider or null
 */
export async function getMetamaskProvider(): Promise<MetaMaskInpageProvider | null> {
  // Check window.ethereum first
  if (window.ethereum && (await hasSnapsSupport(window.ethereum))) {
    return window.ethereum;
  }

  // Check detected providers
  const detectedProvider = await findProviderWithSnaps(
    window.ethereum?.detected,
  );
  if (detectedProvider) {
    return detectedProvider;
  }

  // Check providers array
  const arrayProvider = await findProviderWithSnaps(window.ethereum?.providers);
  if (arrayProvider) {
    return arrayProvider;
  }

  // Finally, try EIP6963
  const eip6963Provider = await getMetaMaskEIP6963Provider();
  if (eip6963Provider && (await hasSnapsSupport(eip6963Provider))) {
    return eip6963Provider;
  }

  return null;
}

export async function isMetaMaskUnlocked() {
  if (!isMetamaskInstalled()) {
    return false;
  }

  const accounts: string[] = await window.ethereum.request({
    method: 'eth_accounts',
  });
  return accounts.length > 0;
}

export function isMetamaskInstalled() {
  return Boolean(window.ethereum);
}

export async function promptAndWaitForWalletUnlock(): Promise<string[]> {
  if (typeof window.ethereum === 'undefined') {
    throw new Error(
      'MetaMask is not installed. Please install it and try again.',
    );
  }

  const ethereum = window.ethereum;

  try {
    // Prompt the user to unlock the wallet
    await ethereum.request({ method: 'eth_requestAccounts' });

    // Wait for accounts to become available
    return new Promise((resolve, reject) => {
      const checkAccounts = async () => {
        try {
          const accounts: string[] = await ethereum.request({
            method: 'eth_accounts',
          });
          if (accounts && accounts.length > 0) {
            resolve(accounts); // Wallet is unlocked
          }
        } catch (error) {
          reject(
            new Error('Error checking accounts: ' + (error as Error).message),
          );
        }
      };

      // Initial check for accounts
      checkAccounts();

      ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          console.log('Wallet unlocked:', accounts);
          resolve(accounts);
        } else {
          console.warn('Accounts changed, but no accounts are available.');
        }
      });
      ethereum.on('disconnect', () => {
        reject(new Error('MetaMask disconnected.'));
      });
    });
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('User rejected the request.');
    } else if (error.message.includes('User closed popup')) {
      throw new Error('MetaMask popup was closed without connecting.');
    } else {
      throw new Error('Wallet unlocking failed.');
    }
  }
}
