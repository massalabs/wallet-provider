import { JsonRpcResponseData, getRequest } from './RequestHandler';
import { PluginInfo } from './types';

// Constants for URLs and plugin information
const MASSA_STATION_URL = 'https://station.massa/plugin-manager';
const PLUGIN_NAME = 'Massa Wallet';
const PLUGIN_AUTHOR = 'Massa Labs';
const TIMEOUT = 4000;

async function fetchPluginData(): Promise<JsonRpcResponseData<PluginInfo[]>> {
  return getRequest<PluginInfo[]>(MASSA_STATION_URL, TIMEOUT);
}

function findWalletPlugin(plugins: PluginInfo[]): PluginInfo | undefined {
  return plugins.find(
    (plugin) => plugin.name === PLUGIN_NAME && plugin.author === PLUGIN_AUTHOR,
  );
}

export async function isMassaStationAvailable(): Promise<boolean> {
  const response = await fetchPluginData();
  return !response.isError;
}

export async function isMassaWalletEnabled(): Promise<boolean> {
  const response = await fetchPluginData();

  if (response.isError) {
    console.warn('Error fetching plugin data:', response.error);
    return false;
  }

  const walletPlugin = findWalletPlugin(response.result);
  return walletPlugin && walletPlugin.status === 'Up';
}
