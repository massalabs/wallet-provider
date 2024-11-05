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

/**
 * Function that calls the MetaMask provider to transfer funds
 * @param provider - The MetaMask provider
 * @param params - The transfer parameters (recipient address, amount, and fee)
 * @returns The operation id of the transfer operation
 * @throws If the user denies the transaction
 */
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
