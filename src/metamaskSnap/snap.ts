import type { MetaMaskInpageProvider } from '@metamask/providers';

import { MASSA_SNAP_ID } from './config';
import { type GetSnapsResponse, Snap } from './types';

export const getInstalledSnaps = async (
  provider: MetaMaskInpageProvider,
): Promise<GetSnapsResponse> =>
  provider.request({
    method: 'wallet_getSnaps',
  });

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

export const isConnected = async (
  provider: MetaMaskInpageProvider,
): Promise<boolean> => {
  const snap = await getMassaSnapInfo(provider);
  return !!snap;
};

export const connectSnap = async (
  provider: MetaMaskInpageProvider,
  params: Record<'version' | string, unknown> = {},
) => {
  return provider.request({
    method: 'wallet_requestSnaps',
    params: {
      [MASSA_SNAP_ID]: params,
    },
  });
};

export const showPrivateKey = async (provider: MetaMaskInpageProvider) => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: { snapId: MASSA_SNAP_ID, request: { method: 'showSecretKey' } },
  });
};
