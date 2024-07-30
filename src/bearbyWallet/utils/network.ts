import { web3 } from '@hicaru/bearby.js';
import { Network } from '@massalabs/massa-web3';

export const networkInfos = async (): Promise<Network> => {
  const { net } = await web3.wallet.network;
  // TODO: fix bearby.js typings
  const { result } = (await web3.massa.getNodesStatus()) as any;
  return {
    name: net,
    chainId: result.chain_id,
  };
};
