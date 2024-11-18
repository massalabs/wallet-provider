import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type TransferParams = {
  recipientAddress: string;
  amount: string;
  fee: string;
};

export type TransferResponse = {
  operationId: string;
};

export const transfer = async (
  provider: MetaMaskInpageProvider,
  params: TransferParams,
): Promise<TransferResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.sendTransaction',
        params,
      },
    },
  }) as Promise<TransferResponse>;
};
