import type {
  EIP6963AnnounceProviderEvent,
  MetaMaskInpageProvider,
} from '@metamask/providers';
import { MetaMaskProvider } from './types/snap';
import { getInstalledSnaps } from './snap';

const PROVIDER_DETECTION_TIMEOUT = 500;

/**
 * Check if a provider supports snaps by calling `wallet_getSnaps`.
 *
 * @param provider - The provider to test for snaps support
 * @returns A promise that resolves to true if snaps are supported
 */
export async function hasSnapsSupport(
  provider: MetaMaskInpageProvider,
): Promise<boolean> {
  try {
    await getInstalledSnaps(provider);
    return true;
  } catch {
    return false;
  }
}

function isMetaMaskProvider(obj: unknown): obj is MetaMaskProvider {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    // eslint-disable-next-line no-prototype-builtins
    obj.hasOwnProperty('isMetaMask') &&
    // eslint-disable-next-line no-prototype-builtins
    obj.hasOwnProperty('request')
  );
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
      if (typeof window.removeEventListener === 'function') {
        window.removeEventListener(
          'eip6963:announceProvider',
          handleAnnouncement,
        );
      }
      clearTimeout(timeout);
    }

    function handleAnnouncement({ detail }: EIP6963AnnounceProviderEvent) {
      if (
        ['io.metamask', 'io.metamask.flask'].includes(detail.info.rdns) &&
        isMetaMaskProvider(detail.provider)
      ) {
        cleanup();
        resolve(detail.provider);
      }
    }

    if (typeof window.addEventListener === 'function') {
      window.addEventListener('eip6963:announceProvider', handleAnnouncement);
    }
    if (typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('eip6963:requestProvider'));
    }
  });
}

/**
 * Get a MetaMask provider that supports snaps.
 *
 * @returns Promise resolving to a compatible provider or null
 */
export async function getMetamaskProvider(): Promise<MetaMaskInpageProvider | null> {
  const eip6963Provider = await getMetaMaskEIP6963Provider();
  if (eip6963Provider && (await hasSnapsSupport(eip6963Provider))) {
    return eip6963Provider;
  }

  return null;
}
