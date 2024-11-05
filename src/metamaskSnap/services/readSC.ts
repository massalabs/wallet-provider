import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type ReadSCParameters = {
  fee?: string;
  functionName: string;
  at: string;
  args: number[];
  coins?: string;
  maxGas?: string;
  caller?: string;
};

export type ReadSCResponse = {
  data: number[];
  infos: {
    gasCost: number;
  };
};

/**
 * Function that calls the MetaMask provider to read a smart contract
 * @param provider - The MetaMask provider
 * @param params - The read smart contract parameters (see massa standard)
 * @returns The response of the operation
 */
export const readSC = async (
  provider: MetaMaskInpageProvider,
  params: ReadSCParameters,
): Promise<ReadSCResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.readSC',
        params,
      },
    },
  }) as Promise<ReadSCResponse>;
};
