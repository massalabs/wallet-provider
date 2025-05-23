import {
  JsonRpcPublicProvider,
  Network,
  getNetworkNameByChainId,
} from '@massalabs/massa-web3';

import { getNetwork } from '../services/getNetwork';
import { MetaMaskInpageProvider } from '@metamask/providers';

// Use client singleton to benefit from caching
let client: JsonRpcPublicProvider;
// Use rpcUrl to check if node has changed
let rpcUrl: string;

export async function networkInfos(
  metaMaskProvider: MetaMaskInpageProvider,
): Promise<Network> {
  const res = await getNetwork(metaMaskProvider);
  const url = res.rpcUrl;

  if (!client || rpcUrl !== url) {
    client = JsonRpcPublicProvider.fromRPCUrl(url) as JsonRpcPublicProvider;
    rpcUrl = url;
  }

  const networkName = getNetworkNameByChainId(BigInt(res.chainId));
  return {
    name: networkName ? networkName : '',
    chainId: BigInt(res.chainId),
    url,
    minimalFee: BigInt(res.minimalFees),
  };
}

export async function getClient(
  metaMaskProvider: MetaMaskInpageProvider,
): Promise<JsonRpcPublicProvider> {
  if (!client) {
    // this initialize client
    await networkInfos(metaMaskProvider);
  }
  return client;
}
