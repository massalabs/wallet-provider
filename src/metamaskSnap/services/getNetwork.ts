import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type NetworkResponse = {
  network: string;
  chainId: string;
  minimalFees: string;
};

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
