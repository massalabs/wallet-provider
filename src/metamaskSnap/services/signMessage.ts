import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type SignMessageParams = {
  data: number[];
};

export type SignMessageResponse = {
  signature: number[];
  publicKey: string;
};

export const signMessage = async (
  provider: MetaMaskInpageProvider,
  params: SignMessageParams,
): Promise<SignMessageResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.sign',
        params,
      },
    },
  }) as Promise<SignMessageResponse>;
};
