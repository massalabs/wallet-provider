import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type ActiveAccountResponse = {
  address: string;
};

/**
 * Function that calls the MetaMask provider to get the active account
 * @param provider - The MetaMask provider
 * @returns The active account address
 */
export const getActiveAccount = async (
  provider: MetaMaskInpageProvider,
): Promise<ActiveAccountResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.getActive',
      },
    },
  }) as Promise<ActiveAccountResponse>;
};
