import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type OperationsResponse = {
  operations: string[];
};

/**
 * Function that calls the MetaMask provider to get the operations ids of the active account
 * @param provider - The MetaMask provider
 * @returns The operations ids of the active account (as a string array of operation ids)
 */
export const getOperations = async (
  provider: MetaMaskInpageProvider,
): Promise<OperationsResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.getOperations',
      },
    },
  }) as Promise<OperationsResponse>;
};
