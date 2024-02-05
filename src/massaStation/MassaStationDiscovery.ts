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

  return !response.isError;
}

export async function isMassaWalletPluginInstalled(): Promise<boolean> {
  const response = await getRequest<PluginManagerBody>(
    MASSA_STATION_DISCOVERY_URL,
    TIMEOUT,
  );

  if (response.isError) {
    return false;
  }

  return !!response.result.find(
    (module) =>
      module.name === MS_WALLET_PLUGIN_NAME &&
      module.author === MS_WALLET_PLUGIN_AUTHOR,
  );
}

export async function isMassaStationAndWalletPluginInstalled(): Promise<boolean> {
  const isMassaStation = await isMassaStationInstalled();
  const isMassaWalletPlugin = await isMassaWalletPluginInstalled();

  return isMassaStation && isMassaWalletPlugin;
}
