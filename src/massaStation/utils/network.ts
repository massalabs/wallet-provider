import {
  JsonRpcPublicProvider,
  Network,
  PublicApiUrl,
} from '@massalabs/massa-web3';
import { MSNetworksResp } from '../types';
import { MASSA_STATION_URL } from '../MassaStationWallet';
import { getRequest } from '../RequestHandler';
import { isStandalone } from './standalone';

// Use client singleton to benefit from caching
let client: JsonRpcPublicProvider;
// Use rpcUrl to check if node has changed
let rpcUrl: string;

export async function networkInfos(): Promise<Network> {
  if (isStandalone()) {
    rpcUrl = PublicApiUrl.Buildnet;
    client = JsonRpcPublicProvider.fromRPCUrl(rpcUrl) as JsonRpcPublicProvider;
    return client.networkInfos();
  }

  const { result } = await getRequest<MSNetworksResp>(
    `${MASSA_STATION_URL}massa/node`,
  );

  const url = result.url;
  if (!client || rpcUrl !== url) {
    client = JsonRpcPublicProvider.fromRPCUrl(url) as JsonRpcPublicProvider;
    rpcUrl = url;
  }

  return client.networkInfos();
}

export async function getClient(): Promise<JsonRpcPublicProvider> {
  if (!client) {
    // this initialize client
    await networkInfos();
  }
  return client;
}
