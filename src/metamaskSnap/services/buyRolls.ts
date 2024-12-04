import type { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type {
  BuyRollsParams,
  BuyRollsResponse,
} from '@massalabs/metamask-snap';

export const buyRolls = async (
  provider: MetaMaskInpageProvider,
  params: BuyRollsParams,
): Promise<BuyRollsResponse> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.buyRolls',
        params,
      },
    },
  });
};
