import type { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type {
  SellRollsParams,
  SellRollsResponse,
} from '@massalabs/metamask-snap';

export const sellRolls = async (
  provider: MetaMaskInpageProvider,
  params: SellRollsParams,
): Promise<SellRollsResponse> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.sellRolls',
        params,
      },
    },
  });
};
