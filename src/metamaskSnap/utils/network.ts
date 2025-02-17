import {
  JsonRPCClient,
  Network,
  getNetworkNameByChainId,
  Mas,
} from '@massalabs/massa-web3';

import { getNetwork } from '../services/getNetwork';
import { MetaMaskInpageProvider } from '@metamask/providers';

// Use client singleton to benefit from caching
let client: JsonRPCClient;
// Use rpcUrl to check if node has changed
let rpcUrl: string;

export async function networkInfos(
  metaMaskProvider: MetaMaskInpageProvider,
): Promise<Network> {
  const res = await getNetwork(metaMaskProvider);
  const url = res.rpcUrl;

  if (!client || rpcUrl !== url) {
    client = new JsonRPCClient(url);
    rpcUrl = url;
  }

  const networkName = getNetworkNameByChainId(BigInt(res.chainId));
  return {
    name: networkName ? networkName : '',
    chainId: BigInt(res.chainId),
    url,
    minimalFee: Mas.fromString(res.minimalFees),
  };
}

export async function getClient(
  metaMaskProvider: MetaMaskInpageProvider,
): Promise<JsonRPCClient> {
  if (!client) {
    // this initialize client
    await networkInfos(metaMaskProvider);
  }
  return client;
}
