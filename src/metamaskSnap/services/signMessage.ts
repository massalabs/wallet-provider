import type { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type {
  SignMessageParams,
  SignMessageResponse,
} from '@massalabs/metamask-snap';

export const signMessage = async (
  provider: MetaMaskInpageProvider,
  params: SignMessageParams,
): Promise<SignMessageResponse> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.sign',
        params,
      },
    },
  });
};
