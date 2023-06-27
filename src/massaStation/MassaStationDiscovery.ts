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
import { Timeout } from '../utils/time';
import { JsonRpcResponseData, getRequest } from './RequestHandler';

/**
 * Url used for the MassaStation discovery and pinging the MassaStation server's index.html
 */
export const MASSA_STATION_DISCOVERY_URL = 'https://station.massa/web/index';

/**
 * A message emitted on successful MassaStation discovery
 */
export const ON_MASSA_STATION_DISCOVERED = 'ON_MASSA_STATION_DISCOVERED';

/**
 * A message emitted on MassaStation disconnect
 */
export const ON_MASSA_STATION_DISCONNECTED = 'ON_MASSA_STATION_DISCONNECTED';

/**
 * This file defines a TypeScript class named MassaStation.
 * The class is being used to recursively ping MassaStation's server
 * and if a response is received emit a message so MassaStation can be enlisted as
 * a wallet provider in the `Connector` class.
 */
export class MassaStationDiscovery extends EventEmitter {
  private timeoutId: Timeout | null = null;
  private isDiscovered = false;

  /**
   * MassaStation constructor
   *
   * @param pollIntervalMillis - Polling interval defined in milliseconds
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
  public constructor(private readonly pollIntervalMillis: number) {
    super();

    // bind class methods
    this.callback = this.callback.bind(this);
    this.stopListening = this.stopListening.bind(this);
    this.startListening = this.startListening.bind(this);
  }

  /**
   * A callback method that triggers a ping of the MassaStation's server
   *
   * @returns void
   */
  private async callback(): Promise<void> {
    let resp: JsonRpcResponseData<unknown> = null;
    try {
      resp = await getRequest(MASSA_STATION_DISCOVERY_URL);
    } catch (ex) {
      console.error(`Error calling ${MASSA_STATION_DISCOVERY_URL}`);
    }

    if (!resp.isError && !resp.error) {
      this.isDiscovered = true;
      this.emit(ON_MASSA_STATION_DISCOVERED);
    }

    if ((resp.isError || resp.error) && this.isDiscovered) {
      this.emit(ON_MASSA_STATION_DISCONNECTED);
    }
  }

  /**
   * A method to stop listening for a connection to MassaStation's server
   *
   * @returns void
   */
  public stopListening(): void {
    if (this.timeoutId) this.timeoutId.clear();
  }

  /**
   * A method to start listening for a connection to MassaStation's server.
   *
   * @returns void
   */
  public startListening(): void {
    const that = this;
    if (this.timeoutId) {
      return;
    }
    this.timeoutId = new Timeout(this.pollIntervalMillis, () =>
      that.callback(),
    );
  }
}
