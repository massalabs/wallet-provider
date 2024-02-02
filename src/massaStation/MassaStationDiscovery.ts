import { getRequest } from './RequestHandler';
import { PluginManagerBody } from './types';

/**
 * Url used for the MassaStation discovery and pinging the MassaStation server's index.html
 */
export const MASSA_STATION_DISCOVERY_URL =
  'https://station.massa/plugin-manager';

const MS_WALLET_PLUGIN_NAME = 'Massa Wallet';
const MS_WALLET_PLUGIN_AUTHOR = 'Massa Labs';
// timeout
const TIMEOUT = 2000;

export async function isMassaStationInstalled(): Promise<boolean> {
  const response = await getRequest<PluginManagerBody>(
    MASSA_STATION_DISCOVERY_URL,
    TIMEOUT,
  );

  if (response.isError) {
    return false;
  }

  const isMassaStation = (module) =>
    module.name === MS_WALLET_PLUGIN_NAME &&
    module.author === MS_WALLET_PLUGIN_AUTHOR;

  return !!response.result.find(isMassaStation);
}
