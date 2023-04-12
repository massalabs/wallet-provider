import { EventEmitter } from 'events';
import { Timeout } from '../utils/time';
import { JsonRpcResponseData, getRequest } from './RequestHandler';

const THYRA_DISCOVERY_URL = 'https://my.massa/thyra/home/index.html';
export const ON_THYRA_DISCOVERED = 'ON_THYRA_DISCOVERED';
export const ON_THYRA_DISCONNECTED = 'ON_THYRA_DISCONNECTED';

export class ThyraDiscovery extends EventEmitter {
  private timeoutId: Timeout | null = null;
  private isDiscovered = false;

  public constructor(private readonly pollIntervalMillis: number) {
    super();

    // bind class methods
    this.callback = this.callback.bind(this);
    this.stopListening = this.stopListening.bind(this);
    this.startListening = this.startListening.bind(this);
  }

  private async callback() {
    let resp: JsonRpcResponseData<any> = null;
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

  public stopListening(): void {
    if (this.timeoutId) this.timeoutId.clear();
  }

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
