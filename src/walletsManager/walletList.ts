import { BearbyWallet } from '../bearbyWallet/BearbyWallet';
import { WalletInterfaces } from './types';
import { Wallet } from '../wallet/interface';
import { wait } from '../utils/time';
import { MassaStationWallet } from '../massaStation/MassaStationWallet';
import { WalletName } from '../wallet/types';
import { MetamaskWallet } from '../metamaskSnap/MetamaskWallet';

export const supportedWallets: WalletInterfaces = [
  BearbyWallet,
  MassaStationWallet,
  MetamaskWallet,
];

export async function getWallets(delay = 200): Promise<Wallet[]> {
  await wait(delay);

  const walletPromises = supportedWallets.map(async (WalletClass) => {
    try {
      return await WalletClass.createIfInstalled();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Error initializing wallet ${WalletClass.name}:`, error);
    }
    return null;
  });

  const resolvedWallets = await Promise.all(walletPromises);

  // remove null values: wallets that failed to initialize
  return resolvedWallets.filter((wallet) => !!wallet) as Wallet[];
}

export async function getWallet(
  name: WalletName,
  delay = 200,
): Promise<Wallet | undefined> {
  const wallets = await getWallets(delay);
  return wallets.find((p) => p.name() === name);
}
