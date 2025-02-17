import { MASSA_STATION_URL } from './MassaStationWallet';
import { JsonRpcResponseData, getRequest } from './RequestHandler';
import { PluginInfo } from './types';

// Constants for URLs and plugin information
const PLUGIN_NAME = 'Massa Wallet';
const PLUGIN_AUTHOR = 'Massa Labs';
const TIMEOUT = 4000;

async function fetchPluginData(): Promise<JsonRpcResponseData<PluginInfo[]>> {
  return getRequest<PluginInfo[]>(
    MASSA_STATION_URL + 'plugin-manager',
    TIMEOUT,
  );
}

function findWalletPlugin(plugins: PluginInfo[]): PluginInfo | undefined {
  return plugins.find(
    (plugin) => plugin.name === PLUGIN_NAME && plugin.author === PLUGIN_AUTHOR,
  );
}

export async function isMassaStationAvailable(): Promise<boolean> {
  try {
    await fetchPluginData();
    return true;
  } catch (_) {
    return false;
  }
}

export async function isMassaWalletEnabled(): Promise<boolean> {
  try {
    const { result } = await fetchPluginData();
    const walletPlugin = findWalletPlugin(result);
    return Boolean(walletPlugin && walletPlugin.status === 'Up');
  } catch (_) {
    return false;
  }
}
