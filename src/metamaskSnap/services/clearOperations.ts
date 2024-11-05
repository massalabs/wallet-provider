import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type ClearOperationsResponse = {
  response: 'OK' | 'ERROR' | 'REFUSED';
  message?: string;
};

/**
 * Function that calls the MetaMask provider to clear the operations of an account
 * @param provider - The MetaMask provider
 * @returns The response of the operation
 */
export const clearOperations = async (
  provider: MetaMaskInpageProvider,
): Promise<ClearOperationsResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.clearOperations',
      },
    },
  }) as Promise<ClearOperationsResponse>;
};
