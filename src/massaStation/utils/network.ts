import { JsonRPCClient, Network } from '@massalabs/massa-web3';
import { MSNetworksResp } from '../types';
import { MASSA_STATION_URL } from '../MassaStationWallet';
import { getRequest } from '../RequestHandler';

// Use client singleton to benefit from caching
let client: JsonRPCClient;
// Use rpcUrl to check if node has changed
let rpcUrl: string;

export async function getClient(): Promise<JsonRPCClient> {
  if(!client){
    // this initialize client
    await this.networkInfos();
  }
  return client;
}

export async function networkInfos(): Promise<Network> {
  const nodesResponse = await getRequest<MSNetworksResp>(
    `${MASSA_STATION_URL}massa/node`,
  );
  if (nodesResponse.isError) throw nodesResponse.error.message;

  const url = nodesResponse.result.url;
  if(!client || rpcUrl !== url){
    client = new JsonRPCClient(url);
    rpcUrl = url;
  }

  return {
    name: nodesResponse.result.network,
    url,
    chainId: BigInt(nodesResponse.result.chainId),
    minimalFee: await client.getMinimalFee(),

  };
}
