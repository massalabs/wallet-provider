import { MetaMaskInpageProvider } from '@metamask/providers';
import { getNetwork } from './getNetwork';
import { Mas } from '@massalabs/massa-web3';

export const getMinimalFees = async (
  provider: MetaMaskInpageProvider,
): Promise<bigint> => {
  const network = await getNetwork(provider);
  return Mas.fromString(network.minimalFees);
};
