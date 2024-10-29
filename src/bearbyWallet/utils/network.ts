import { web3 } from '@hicaru/bearby.js';
import { Mas, Network } from '@massalabs/massa-web3';

export const networkInfos = async (): Promise<Network> => {
  const { net } = await web3.wallet.network;
  // TODO: fix bearby.js typings
  const res = (await web3.massa.getNodesStatus()) as any;
  if (res.error) {
    throw new Error(res.error?.message || 'Bearby getNodesStatus error');
  }
  return {
    name: net,
    chainId: res.result.chain_id,
    minimalFee: Mas.fromString(res.result.minimal_fees),
  };
};
