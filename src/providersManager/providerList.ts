import { web3 } from '@hicaru/bearby.js';
import { BearbyProvider } from '../bearbyWallet/BearbyProvider';
import { isMassaWalletEnabled } from '../massaStation/MassaStationDiscovery';
import { MassaStationProvider } from '../massaStation/MassaStationProvider';
import { IProvider } from '../provider/IProvider';

export type ProviderList = {
  name: string;
  checkInstalled: () => Promise<boolean>;
  createInstance: () => IProvider;
};

export const providerList: ProviderList[] = [
  {
    name: 'BEARBY',
    checkInstalled: async () => web3.wallet.installed,
    createInstance: () => new BearbyProvider(),
  },
  {
    name: 'MASSA_STATION',
    checkInstalled: isMassaWalletEnabled,
    createInstance: () => new MassaStationProvider(),
  },
];
