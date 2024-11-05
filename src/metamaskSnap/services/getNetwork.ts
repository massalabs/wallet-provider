import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type NetworkResponse = {
  network: string;
  chainId: string;
  minimalFees: string;
};

/**
 * Function that calls the MetaMask provider to get the current network
 * @param provider - The MetaMask provider
 * @returns The current network details
 */
export const getNetwork = async (
  provider: MetaMaskInpageProvider,
): Promise<NetworkResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'Provider.getNetwork',
      },
    },
  }) as Promise<NetworkResponse>;
};
