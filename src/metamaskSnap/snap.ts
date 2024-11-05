import type { MetaMaskInpageProvider } from '@metamask/providers';

import { MASSA_SNAP_ID } from './config';
import type { GetSnapsResponse, Snap } from './types';
import log from 'loglevel';

log.setLevel('error');

const getInstalledSnaps = async (
  provider: MetaMaskInpageProvider,
): Promise<GetSnapsResponse> =>
  await provider.request({
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
  await provider.request({
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
    log.error('Failed to obtain installed snap', error);
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
