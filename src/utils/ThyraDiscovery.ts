import { EventEmitter } from 'events';
import { Timeout } from './time';
import axios, { AxiosResponse, AxiosRequestHeaders } from 'axios';

const requestHeaders = {
  Accept:
    'application/json,text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
  'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE,PATCH,OPTIONS',
} as AxiosRequestHeaders;

const THYRA_DISCOVERY_URL = 'https://my.massa/thyra/home/index.html';

export interface JsonRpcResponseData<T> {
  isError: boolean;
  result: T | null;
  error: Error | null;
}

async function callUrl<T>(url: string): Promise<JsonRpcResponseData<T>> {
  let resp: AxiosResponse = null;

  try {
    resp = await axios.get(url, requestHeaders);
  } catch (ex) {
    return {
      isError: true,
      result: null,
      error: new Error('JSON.parse error: ' + String(ex)),
    } as JsonRpcResponseData<T>;
  }

  const responseData: any = resp.data;

  if (responseData.error) {
    return {
      isError: true,
      result: null,
      error: new Error(responseData.error.message),
    } as JsonRpcResponseData<T>;
  }

  return {
    isError: false,
    result: responseData.result as T,
    error: null,
  } as JsonRpcResponseData<T>;
}

export const ON_THYRA_DISCOVERED = 'ON_THYRA_DISCOVERED';

export class ThyraDiscovery extends EventEmitter {
  private timeoutId: Timeout | null = null;

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
      resp = await callUrl(THYRA_DISCOVERY_URL);
    } catch (ex) {
      console.error(`Error calling ${THYRA_DISCOVERY_URL}`);
    }

    if (!resp.isError && !resp.error) {
      this.emit(ON_THYRA_DISCOVERED);
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
