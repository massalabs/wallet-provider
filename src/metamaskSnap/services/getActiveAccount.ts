import type { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type { ActiveAccountResponse } from '@massalabs/metamask-snap';

export const getActiveAccount = async (
  provider: MetaMaskInpageProvider,
): Promise<ActiveAccountResponse> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.getActive',
      },
    },
  });
};
