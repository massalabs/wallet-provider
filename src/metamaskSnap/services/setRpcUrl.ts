import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type SetRpcUrlParams = {
  network: string; // url
};

export type SetRpcUrlResponse = {
  network: string; // url
};

/**
 * Function that calls the MetaMask provider to set a new rpc url
 * @param provider - The MetaMask provider
 * @param params - The set network parameters (network id to set as a string)
 * @returns The response of the operation
 */
export const setRpcUrl = async (
  provider: MetaMaskInpageProvider,
  params: SetRpcUrlParams,
): Promise<SetRpcUrlResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'Provider.setNetwork',
        params,
      },
    },
  }) as Promise<SetRpcUrlResponse>;
};
