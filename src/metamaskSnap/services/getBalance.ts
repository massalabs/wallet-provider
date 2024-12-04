import type { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type {
  AccountBalanceParams,
  AccountBalanceResponse,
} from '@massalabs/metamask-snap';

export const getBalance = (
  provider: MetaMaskInpageProvider,
  params: AccountBalanceParams,
): Promise<AccountBalanceResponse> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.balance',
        params,
      },
    },
  });
};
