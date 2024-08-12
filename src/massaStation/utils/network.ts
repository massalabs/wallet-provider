import { Mas, Network } from '@massalabs/massa-web3';
import { MSNetworksResp } from '../types';
import { MASSA_STATION_URL } from '../MassaStationWallet';
import { getRequest } from '../RequestHandler';

export async function networkInfos(): Promise<Network> {
  const nodesResponse = await getRequest<MSNetworksResp>(
    `${MASSA_STATION_URL}massa/node`,
  );

  if (nodesResponse.isError) throw nodesResponse.error.message;

  return {
    name: nodesResponse.result.network,
    url: nodesResponse.result.url,
    chainId: BigInt(nodesResponse.result.chainId),
    // TODO - fix this. should be done from massaStation
    minimalFee: Mas.fromString('0.01'),
  };
}
