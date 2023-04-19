/**
 * This file defines a TypeScript class named ThyraDiscovery.
 * The class is being used to recursively search for a connection to Thyra's server
 * and if so report this via emitting messages.
 *
 * @remarks
 * - If you are only looking to use our library, the connector ThyraDiscovery will not be useful to you.
 * - If you want to work on this repo, you will probably be interested in this object
 *
 */

import { EventEmitter } from 'events';
import { Timeout } from '../utils/time';
import { JsonRpcResponseData, getRequest } from './RequestHandler';

/**
 * Url used for the thyra discovery and pinging the thyra server's index.html
 */
export const THYRA_DISCOVERY_URL = 'https://my.massa/thyra/home/index.html';

/**
 * A message emitted on successful Thyra discovery
 */
export const ON_THYRA_DISCOVERED = 'ON_THYRA_DISCOVERED';

/**
 * A message emitted on Thyra disconnect
 */
export const ON_THYRA_DISCONNECTED = 'ON_THYRA_DISCONNECTED';

/**
 * This file defines a TypeScript class named ThyraDiscovery.
 * The class is being used to recursively ping Thyra's server
 * and if a response is received emit a message so Thyra can be enlisted as a wallet provider in the `Connector` class.
 */
export class ThyraDiscovery extends EventEmitter {
  private timeoutId: Timeout | null = null;
  private isDiscovered = false;

  /**
   * ThyraDiscovery constructor
   *
   * @param pollIntervalMillis - Polling interval defined in milliseconds
   *
   * @remarks
   * - It creates a timeout using the given `pollIntervalMillis` argument on every trigger of which
   *  the Thyra pinging is triggered and if a successful response is fetched,
   * a message `ON_THYRA_DISCOVERED` is emitted that Thyra has been discovered
   * as a wallet provider upon which the `Connector` class will enlist Thyra as a wallet provider
   * - If once found, but then disconnected the following message `ON_THYRA_DISCONNECTED` is being emitted
   *  so that the `Connector` class delists Thyra as a wallet provider
   *
   * @returns An instance of the ThyraDiscovery class.
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
   * A callback method that triggers a ping of the Thyra's server
   *
   * @returns void
   */
  private async callback(): Promise<void> {
    let resp: JsonRpcResponseData<unknown> = null;
    try {
      resp = await getRequest(THYRA_DISCOVERY_URL);
    } catch (ex) {
      console.error(`Error calling ${THYRA_DISCOVERY_URL}`);
    }

    if (!resp.isError && !resp.error) {
      this.isDiscovered = true;
      this.emit(ON_THYRA_DISCOVERED);
    }

    if ((resp.isError || resp.error) && this.isDiscovered) {
      this.emit(ON_THYRA_DISCONNECTED);
    }

    // reset the interval
    this.timeoutId = new Timeout(this.pollIntervalMillis, () =>
      this.callback(),
    );
  }

  /**
   * A method to stop listening for a connection to Thyra's server
   *
   * @returns void
   */
  public stopListening(): void {
    if (this.timeoutId) this.timeoutId.clear();
  }

  /**
   * A method to start listening for a connection to Thyra's server.
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
