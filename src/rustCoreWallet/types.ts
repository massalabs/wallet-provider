/**
 * The API the RustCore Wallet browser extension injects into web pages as
 * `window.rustcore` (protocol v1).
 *
 * Values cross the bridge as JSON: amounts as decimal strings of the smallest
 * unit, bytes as base64.
 *
 * @see https://github.com/RustCoreMassa/rust-core-wallet/blob/master/docs/DAPP-CONNECTION.md
 */
export type RustCoreInjected = {
  readonly isRustCore: true;
  /** Protocol version, "1". */
  readonly version: string;
  request(method: string, params?: unknown): Promise<unknown>;
  /** Subscribes to an event; returns the function that unsubscribes. */
  on(event: RustCoreEvent, callback: (data: unknown) => void): () => void;
};

/**
 * `accountChanged` carries `address`: the account the site uses is another
 * one. `accountsChanged` (from 1.6.0) carries `addresses`: the accounts the
 * site may see changed, the one in use first.
 */
export type RustCoreEvent =
  | 'accountChanged'
  | 'accountsChanged'
  | 'networkChanged'
  | 'disconnect';

/** What `network` answers and `networkChanged` carries. */
export type RustCoreNetwork = {
  name: string;
  chainId: string;
  url: string;
  minimalFee: string;
};

/** Error codes of the requests RustCore rejects. */
export enum RustCoreErrorCode {
  UserRejected = 4001,
  Unauthorized = 4100,
  UnsupportedMethod = 4200,
  Busy = 4900,
  InvalidParams = -32602,
  Internal = -32603,
}
