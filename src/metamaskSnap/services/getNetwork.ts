import type { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type { NetworkResponse } from '@massalabs/metamask-snap';

export const getNetwork = async (
  provider: MetaMaskInpageProvider,
): Promise<NetworkResponse> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'Provider.getNetwork',
      },
    },
  });
};
