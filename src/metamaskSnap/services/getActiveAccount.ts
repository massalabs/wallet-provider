import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type ActiveAccountResponse = {
  address: string;
};

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
