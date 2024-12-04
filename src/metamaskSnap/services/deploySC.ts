import type { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type { DeploySCParams, CallSCResponse } from '@massalabs/metamask-snap';

export const deploySC = async (
  provider: MetaMaskInpageProvider,
  params: DeploySCParams,
): Promise<CallSCResponse> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.deploySC',
        params,
      },
    },
  });
};
