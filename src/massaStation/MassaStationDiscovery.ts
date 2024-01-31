/**
 * This file defines a TypeScript class named MassaStationDiscovery.
 * The class is being used to recursively search for a connection to MassaStation's server
 * and if so report this via emitting messages.
 *
 * @remarks
 * - If you are only looking to use our library, the connector MassaStationDiscovery will not be useful to you.
 * - If you want to work on this repo, you will probably be interested in this object
 *
 */

import { EventEmitter } from 'events';
import { getRequest } from './RequestHandler';
import { PluginManagerBody } from './types';

/**
 * Url used for the MassaStation discovery and pinging the MassaStation server's index.html
 */
export const MASSA_STATION_DISCOVERY_URL =
  'https://station.massa/plugin-manager';

/**
 * A message emitted on successful MassaStation discovery
 */
export const ON_MASSA_STATION_DISCOVERED = 'ON_MASSA_STATION_DISCOVERED';

/**
 * A message emitted on MassaStation disconnect
 */
export const ON_MASSA_STATION_DISCONNECTED = 'ON_MASSA_STATION_DISCONNECTED';

const MS_WALLET_PLUGIN_NAME = 'Massa Wallet';
const MS_WALLET_PLUGIN_AUTHOR = 'Massa Labs';
// timeout
const TIMEOUT = 2000;
/**
 * This file defines a TypeScript class named MassaStation.
 * The class is being used to recursively ping MassaStation's server
 * and if a response is received emit a message so MassaStation can be enlisted as
 * a wallet provider in the `Connector` class.
 */
export class MassaStationDiscovery extends EventEmitter {
  private isDiscovered = false;

  /**
   * MassaStation constructor
   *
   * @remarks
   * - It creates a timeout using the given `pollIntervalMillis` argument on every trigger of which
   *  the MassaStation pinging is triggered and if a successful response is fetched,
   * a message `ON_MASSA_STATION_DISCOVERED` is emitted that MassaStation has been discovered
   * as a wallet provider upon which the `Connector` class will enlist MassaStation as a wallet provider
   * - If once found, but then disconnected the following message `ON_MASSA_STATION_DISCONNECTED` is being emitted
   *  so that the `Connector` class delists MassaStation as a wallet provider
   *
   * @returns An instance of the MassaStation class.
   *
   */
  public constructor() {
    super();
  }

  /**
   * A method to start listening for a connection to MassaStation's server.
   *
   * @returns void
   */
  public async startListening(): Promise<void> {
    const resp = await getRequest<PluginManagerBody>(
      MASSA_STATION_DISCOVERY_URL,
      2000,
    );

    if (!resp.isError) {
      const walletModule = resp.result.find(
        (module) =>
          module.name === MS_WALLET_PLUGIN_NAME &&
          module.author === MS_WALLET_PLUGIN_AUTHOR,
      );
      if (walletModule) {
        this.isDiscovered = true;
        this.emit(ON_MASSA_STATION_DISCOVERED, walletModule);
      }
    } else if (this.isDiscovered) {
      this.isDiscovered = false;
      this.emit(ON_MASSA_STATION_DISCONNECTED);
    }
  }
}


export async function isMassaStationInstalled(): Promise<boolean> {

  try {
    // TODO - why we need timeout here?
    const response = await getRequest<PluginManagerBody>(MASSA_STATION_DISCOVERY_URL, TIMEOUT);

    if (!response || !Array.isArray(response.result)) {
      console.error('Invalid response structure from MASSA Station Discovery URL');
      return false;
    }

    const walletModule = response.result.find(module =>
      module.name === MS_WALLET_PLUGIN_NAME && module.author === MS_WALLET_PLUGIN_AUTHOR
    );

    return !!walletModule;
  } catch (error) {
    console.error('Error fetching data from MASSA Station Discovery URL:', error);
    return false;
  }
}