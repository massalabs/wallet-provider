import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type AccountBalanceParams = {
  address?: string;
};

export type AccountBalanceResponse = {
  finalBalance: string;
  candidateBalance: string;
};

export const getBalance = (
  provider: MetaMaskInpageProvider,
  params: AccountBalanceParams,
) => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.balance',
        params,
      },
    },
  }) as Promise<AccountBalanceResponse>;
};
