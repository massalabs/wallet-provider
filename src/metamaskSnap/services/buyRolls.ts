import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type BuyRollsParams = {
  fee: string;
  amount: string;
};

export type BuyRollsResponse = {
  operationId: string;
};

export const buyRolls = async (
  provider: MetaMaskInpageProvider,
  params: BuyRollsParams,
): Promise<BuyRollsResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.buyRolls',
        params,
      },
    },
  }) as Promise<BuyRollsResponse>;
};
