import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type NodeUrlsResponse = {
  urls: string[];
};

/**
 * Function that calls the MetaMask provider to get the node URLs for the current active network
 * @param provider - The MetaMask provider
 * @returns The node URLs for the current active network
 */
export const getNodeUrls = async (
  provider: MetaMaskInpageProvider,
): Promise<NodeUrlsResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'Provider.getNodeUrl',
      },
    },
  }) as Promise<NodeUrlsResponse>;
};
