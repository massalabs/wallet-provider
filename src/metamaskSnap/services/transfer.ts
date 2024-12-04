import type { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type {
  TransferParams,
  TransferResponse,
} from '@massalabs/metamask-snap';

export const transfer = async (
  provider: MetaMaskInpageProvider,
  params: TransferParams,
): Promise<TransferResponse> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.sendTransaction',
        params,
      },
    },
  });
};
