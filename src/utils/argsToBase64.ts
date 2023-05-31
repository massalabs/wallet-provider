import { Args } from '@massalabs/massa-web3';

/**
 * Converts an Args object to a base64 string
 *
 * @param arg - The argument to convert to base64
 * @returns The base64 string
 */
export function argsToBase64(arg: Args): string {
  let binary = '';
  const array = new Uint8Array(arg.serialize());
  for (let i = 0; i < array.length; i++) {
    binary += String.fromCharCode(array[i]);
  }
  return btoa(binary);
}
