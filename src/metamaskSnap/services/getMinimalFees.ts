import type { MetaMaskInpageProvider } from '@metamask/providers';
import { getNetwork } from './getNetwork';

export const getMinimalFees = async (
  provider: MetaMaskInpageProvider,
): Promise<bigint> => {
  const { minimalFees } = await getNetwork(provider);
  return BigInt(minimalFees);
};
