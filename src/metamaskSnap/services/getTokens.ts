import { MetaMaskInpageProvider } from '@metamask/providers';
import { MASSA_SNAP_ID } from '../config';

export type TokensResponse = {
  tokens: string[];
};

/**
 * Function that calls the MetaMask provider to get the tokens of the active account
 * @param provider - The MetaMask provider
 * @param params - The get tokens parameters (account address is optional, defaults to the active account)
 * @returns The tokens of the active account (as a string array of token addresses)
 * @throws If the account is not found
 */
export const getTokens = async (
  provider: MetaMaskInpageProvider,
  params?: { address?: string },
): Promise<TokensResponse | undefined> => {
  return provider.request({
    method: 'wallet_invokeSnap',
    params: {
      snapId: MASSA_SNAP_ID,
      request: {
        method: 'account.getTokens',
        params,
      },
    },
  }) as Promise<TokensResponse>;
};
