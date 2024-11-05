import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type SellRollsParams = {
  fee: string;
  amount: string;
};

export type SellRollsResponse = {
  operationId: string;
};

/**
 * Function that calls the MetaMask provider to sell rolls
 * @param provider - The MetaMask provider
 * @param params - The sell rolls parameters (amount and fee)
 * @returns The operation id of the sell rolls operation
 */
export const sellRolls = async (
  provider: MetaMaskInpageProvider,
  params: SellRollsParams,
): Promise<SellRollsResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.sellRolls',
        params,
      },
    },
  }) as Promise<SellRollsResponse>;
};
