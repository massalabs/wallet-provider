import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type SignMessageParams = {
  data: number[];
};

export type SignMessageResponse = {
  signature: number[];
  publicKey: string;
};

/**
 * Function that calls the MetaMask provider to sign a message
 * @param provider - The MetaMask provider
 * @param params - The sign message parameters (serialized data message as bytes)
 * @returns The signature and public key used to sign the message
 */
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
