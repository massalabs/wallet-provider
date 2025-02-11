import {
  CHAIN_ID,
  JsonRPCClient,
  Network,
  NetworkName,
  PublicApiUrl,
} from '@massalabs/massa-web3';
import { MSNetworksResp } from '../types';
import { MASSA_STATION_URL } from '../MassaStationWallet';
import { getRequest } from '../RequestHandler';
import { isStandalone } from './standalone';

// Use client singleton to benefit from caching
let client: JsonRPCClient;
// Use rpcUrl to check if node has changed
let rpcUrl: string;

export async function networkInfos(): Promise<Network> {
  if (isStandalone()) {
    rpcUrl = PublicApiUrl.Buildnet;
    client = new JsonRPCClient(rpcUrl);
    return {
      name: NetworkName.Buildnet,
      url: rpcUrl,
      chainId: CHAIN_ID.Buildnet,
      minimalFee: await client.getMinimalFee(),
    };
  }

  const { result } = await getRequest<MSNetworksResp>(
    `${MASSA_STATION_URL}massa/node`,
  );

  const url = result.url;
  if (!client || rpcUrl !== url) {
    client = new JsonRPCClient(url);
    rpcUrl = url;
  }

  return {
    name: result.network,
    url,
    chainId: BigInt(result.chainId),
    minimalFee: await client.getMinimalFee(),
  };
}

export async function getClient(): Promise<JsonRPCClient> {
  if (!client) {
    // this initialize client
    await networkInfos();
  }
  return client;
}
