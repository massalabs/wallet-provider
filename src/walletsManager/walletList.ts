import { web3 } from '@hicaru/bearby.js';
import {
  WALLET_NAME as BEARBY,
  BearbyWallet,
} from '../bearbyWallet/BearbyWallet';
import { isMassaWalletEnabled } from '../massaStation/MassaStationDiscovery';
import { SupportedWallet } from './types';
import { Wallet } from '../wallet/interface';
import { wait } from '../utils/time';
import {
  MassaStationWallet,
  WALLET_NAME as MASSASTATION,
} from '../massaStation/MassaStationWallet';

export const supportedWallets: SupportedWallet[] = [
  {
    name: BEARBY,
    checkInstalled: async () => web3.wallet.installed,
    createInstance: () => new BearbyWallet(),
  },
  {
    name: MASSASTATION,
    checkInstalled: isMassaWalletEnabled,
    createInstance: () => new MassaStationWallet(),
  },
];

export async function getWallets(delay = 200): Promise<Wallet[]> {
  await wait(delay);

  return Promise.all(
    supportedWallets
      .map(async (wallet): Promise<Wallet> | undefined => {
        try {
          if (await wallet.checkInstalled()) {
            return wallet.createInstance();
          }
        } catch (error) {
          console.error(`Error initializing wallet ${wallet.name}:`, error);
          return undefined;
        }
        return undefined;
      })
      .filter((wallet) => wallet !== undefined),
  );
}
