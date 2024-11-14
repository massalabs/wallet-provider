import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type ShowCredentialsParams = {
  address?: string;
};

/**
 * Function that calls the MetaMask provider to show the credentials of an account
 * Displayed as an alert dialog in MetaMask
 * @param provider - The MetaMask provider
 * @param params - The show credentials parameters (address is optional, defaults to the active account)
 * @returns The response of the operation
 */
export const showCredentials = async (
  provider: MetaMaskInpageProvider,
): Promise<void> => {
  return provider.request<void>({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.showCredentials',
      },
    },
  });
};
