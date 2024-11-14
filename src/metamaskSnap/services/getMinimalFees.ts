import { MetaMaskInpageProvider } from '@metamask/providers';
import { getNetwork } from './getNetwork';
import { Mas } from '@massalabs/massa-web3';

/**
 * Function that calls the MetaMask provider to get the current network
 * @param provider - The MetaMask provider
 * @returns The current network details
 */
export const getMinimalFees = async (
  provider: MetaMaskInpageProvider,
): Promise<bigint> => {
  const network = await getNetwork(provider);
  return Mas.fromString(network.minimalFees);
};
