import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type { AccountToken } from '../types/account-token';

export type AddTokenParams = {
  address: string;
};

export type AddTokenResponse = AccountToken;

/**
 * Function that calls the MetaMask provider to add a token
 * @param provider - The MetaMask provider
 * @param params - The add token parameters (address of the token)
 * @returns The response of the operation
 */
export const addToken = async (
  provider: MetaMaskInpageProvider,
  params: AddTokenParams,
): Promise<AddTokenResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.addToken',
        params,
      },
    },
  }) as Promise<AddTokenResponse>;
};
