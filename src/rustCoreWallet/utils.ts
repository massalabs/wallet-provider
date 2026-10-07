import { Network } from '@massalabs/massa-web3';
import { UserRejectionError } from '../errors';
import { RustCoreErrorCode, RustCoreInjected, RustCoreNetwork } from './types';

/** The extension's API if it is installed in this page. */
export function getRustCore(): RustCoreInjected | undefined {
  if (typeof window === 'undefined') return undefined;
  const rustcore = (window as { rustcore?: Partial<RustCoreInjected> })
    .rustcore;
  return rustcore?.isRustCore === true && typeof rustcore.request === 'function'
    ? (rustcore as RustCoreInjected)
    : undefined;
}

export function toNetwork(info: RustCoreNetwork): Network {
  return {
    name: info.name,
    chainId: BigInt(info.chainId),
    url: info.url,
    minimalFee: BigInt(info.minimalFee),
  };
}

export function isUserRejection(error: unknown): boolean {
  return (error as { code?: unknown })?.code === RustCoreErrorCode.UserRejected;
}

/** Turns the wallet's "rejected by the user" (4001) into a UserRejectionError. */
export function rustCoreErrorHandler(
  operationName: string,
  error: Error,
): Error {
  if (isUserRejection(error)) {
    return new UserRejectionError({ operationName, cause: error });
  }
  return error;
}
