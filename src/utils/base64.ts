import { Args } from '@massalabs/massa-web3';

/**
 * Converts a Uint8Array to a base64 string
 *
 * @param bytes - The Uint8Array to convert to base64
 * @returns The base64 string
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binaryString = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryString += String.fromCharCode(bytes[i]);
  }
  return btoa(binaryString);
}

/**
 * Converts an Args object to a base64 string
 *
 * @param arg - The argument to convert to base64
 * @returns The base64 string
 */
export function argsToBase64(arg: Args): string {
  return uint8ArrayToBase64(arg.serialize());
}

export async function base64ToByteArray(base64: string): Promise<Uint8Array> {
  const res = await fetch('data:text;base64,' + base64);
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}
