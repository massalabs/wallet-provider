import type { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type { CallSCParams, CallSCResponse } from '@massalabs/metamask-snap';

export const callSC = async (
  provider: MetaMaskInpageProvider,
  params: CallSCParams,
): Promise<CallSCResponse> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.callSC',
        params,
      },
    },
  });
};
