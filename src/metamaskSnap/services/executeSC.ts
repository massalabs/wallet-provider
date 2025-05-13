import type { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';
import type {
  ExecuteSCParameters,
  ExecuteSCResponse,
} from '@massalabs/metamask-snap';

export const executeSC = async (
  provider: MetaMaskInpageProvider,
  params: ExecuteSCParameters,
): Promise<ExecuteSCResponse> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.executeSC',
        params,
      },
    },
  });
};
