import { Network } from '@massalabs/massa-web3';
import { RustCoreInjected, RustCoreNetwork } from './types';

/** The extension's API if it is installed in this page. */
export function getRustCore(): RustCoreInjected | undefined {
  if (typeof window === 'undefined') return undefined;
  const rustcore = (window as { rustcore?: Partial<RustCoreInjected> })
    .rustcore;
  return rustcore?.isRustCore === true &&
    typeof rustcore.request === 'function' &&
    typeof rustcore.on === 'function'
    ? (rustcore as RustCoreInjected)
    : undefined;
}

const DIGITS = /^\d+$/;

/** Is this a network as the extension sends it (`network`, `networkChanged`)? */
export function isRustCoreNetwork(data: unknown): data is RustCoreNetwork {
  const n = data as Partial<Record<keyof RustCoreNetwork, unknown>>;
  return (
    typeof n?.name === 'string' &&
    typeof n.url === 'string' &&
    typeof n.chainId === 'string' &&
    DIGITS.test(n.chainId) &&
    typeof n.minimalFee === 'string' &&
    DIGITS.test(n.minimalFee)
  );
}

export function toNetwork(info: RustCoreNetwork): Network {
  return {
    name: info.name,
    chainId: BigInt(info.chainId),
    url: info.url,
    minimalFee: BigInt(info.minimalFee),
  };
}
