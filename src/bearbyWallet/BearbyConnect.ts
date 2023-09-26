import { web3 } from '@hicaru/bearby.js';

export async function detectBearby(): Promise<boolean> {
  return !!globalThis?.window?.bearby;
}

export async function connectBearby(): Promise<void> {
  try {
    await web3.wallet.connect();
  } catch (ex) {
    console.log(ex);
  }
}

export async function disconnectBearby(): Promise<void> {
  await web3.wallet.disconnect();
  console.log('Bearby disconnected');
}
