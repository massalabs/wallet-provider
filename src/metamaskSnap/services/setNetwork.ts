import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type SetNetworkParams = {
  network: string; // url
};

export type SetNetworkResponse = {
  network: string; // url
};

/**
 * Function that calls the MetaMask provider to set the current network
 * @param provider - The MetaMask provider
 * @param params - The set network parameters (network id to set as a string)
 * @returns The response of the operation
 */
export const setNetwork = async (
  provider: MetaMaskInpageProvider,
  params: SetNetworkParams,
): Promise<SetNetworkResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'Provider.setNetwork',
        params,
      },
    },
  }) as Promise<SetNetworkResponse>;
};
