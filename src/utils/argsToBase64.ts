import { Args } from '@massalabs/web3-utils';

/**
 * Converts an Args object to a base64 string
 *
 * @param arg - The argument to convert to base64
 * @returns The base64 string
 */
export function argsToBase64(arg: Args): string {
  const array = arg.serialize();
  return Buffer.from(array).toString('base64');
}

/**
 * Converts a Uint8Array to a base64 string
 *
 * @param arg - The Uint8Array to convert to base64
 * @returns The base64 string
 */
export function uint8ArrayToBase64(arg: Uint8Array): string {
  return Buffer.from(arg).toString('base64');
}
