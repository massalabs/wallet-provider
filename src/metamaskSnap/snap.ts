import type { MetaMaskInpageProvider } from '@metamask/providers';

import { MASSA_SNAP_ID } from './config';
import type { GetSnapsResponse, Snap } from './types';

const getInstalledSnaps = async (
  provider: MetaMaskInpageProvider,
): Promise<GetSnapsResponse> =>
  provider.request({
    method: 'wallet_getSnaps',
  });

/**
 * Connect a snap to MetaMask.
 *
 * @param provider - The MetaMask inpage provider.
 * @param snapId - The ID of the snap.
 * @param params - The params to pass with the snap to connect.
 */
export const connectSnap = async (
  provider: MetaMaskInpageProvider,
  snapId: string = MASSA_SNAP_ID,
  params: Record<'version' | string, unknown> = {},
) => {
  provider.request({
    method: 'wallet_requestSnaps',
    params: {
      [snapId]: params,
    },
  });
};

export const getMassaSnapInfo = async (
  provider: MetaMaskInpageProvider,
  version?: string,
): Promise<Snap | undefined> => {
  try {
    const snaps = await getInstalledSnaps(provider);

    return Object.values(snaps).find(
      (snap) =>
        snap.id === MASSA_SNAP_ID && (!version || snap.version === version),
    );
  } catch (error) {
    console.error('Failed to obtain installed snap', error);
    return undefined;
  }
};

export const showPrivateKey = async (provider: MetaMaskInpageProvider) => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: { snapId: MASSA_SNAP_ID, request: { method: 'showSecretKey' } },
  });
};

export const isLocalSnap = (snapId: string) => snapId.startsWith('local:');

export async function isDappConnectedToSnap(snapId: string): Promise<boolean> {
  if (typeof window.ethereum === 'undefined') {
    console.error('MetaMask is not installed.');
    return false;
  }

  try {
    // Request all installed snaps
    const installedSnaps = await window.ethereum.request({
      method: 'wallet_getSnaps',
    });

    // Check if the specific Snap is installed
    const snap = installedSnaps[snapId];
    if (!snap) {
      console.log(`Snap with ID ${snapId} is not installed.`);
      return false;
    }

    // Check if the current dApp is allowed
    const currentOrigin = window.location.origin;
    const allowedOrigins =
      snap.permissions?.snap_allowedOrigins?.caveats?.[0]?.value || [];

    if (allowedOrigins.includes(currentOrigin)) {
      console.log(`DApp ${currentOrigin} is already connected to the Snap.`);
      return true;
    } else {
      console.log(`DApp ${currentOrigin} is NOT connected to the Snap.`);
      return false;
    }
  } catch (error) {
    console.error('Error checking Snap connection:', error);
    return false;
  }
}
