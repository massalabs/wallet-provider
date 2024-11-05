import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type DeleteTokenParams = {
  address: string;
};

export type DeleteTokenResponse = {
  response: 'OK' | 'ERROR';
  message?: string;
};

/**
 * Function that calls the MetaMask provider to delete a token
 * @param provider - The MetaMask provider
 * @param params - The delete token parameters (address of the token)
 * @returns The response of the operation
 */
export const deleteToken = async (
  provider: MetaMaskInpageProvider,
  params: DeleteTokenParams,
): Promise<DeleteTokenResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.deleteToken',
        params,
      },
    },
  }) as Promise<DeleteTokenResponse>;
};
