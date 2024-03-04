import { web3 } from '@hicaru/bearby.js';
import { CHAIN_ID_RPC_URL_MAP } from '@massalabs/web3-utils';

export const bearbyChainId = async (): Promise<bigint> => {
  // TODO: remove any when bearby.js is updated https://github.com/bearby-wallet/bearby-web3/issues/10
  const info = (await web3.massa.getNodesStatus()) as any;
  return BigInt(info.result.chain_id);
};

export const bearbyNetwork = async (): Promise<string> => {
  const network = await web3.wallet.network;
  return network.net;
};

export const bearbyNodeUrl = async (): Promise<string> => {
  const chainId = await bearbyChainId();

  return CHAIN_ID_RPC_URL_MAP[chainId.toString()];
};
