import type { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type {
  SetRpcUrlParams,
  SetRpcUrlResponse,
} from '@massalabs/metamask-snap';

export const setRpcUrl = async (
  provider: MetaMaskInpageProvider,
  params: SetRpcUrlParams,
): Promise<SetRpcUrlResponse> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'Provider.setNetwork',
        params,
      },
    },
  });
};
