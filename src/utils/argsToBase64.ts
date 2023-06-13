import { Args } from '@massalabs/massa-web3';

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
