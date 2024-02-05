import { web3 } from '@hicaru/bearby.js';
import { BearbyProvider } from '../bearbyWallet/BearbyProvider';
import { isMassaStationAndWalletPluginInstalled } from '../massaStation/MassaStationDiscovery';
import { MassaStationProvider } from '../massaStation/MassaStationProvider';
import { IProvider } from '../provider/IProvider';

export type ProviderList = {
  name: string;
  checkInstalled: () => Promise<boolean>;
  createInstance: () => IProvider;
  isInstalled: boolean;
};

export const providerList: ProviderList[] = [
  {
    name: 'BEARBY',
    checkInstalled: async () => web3.wallet.installed,
    createInstance: () => new BearbyProvider(),
    isInstalled: false,
  },
  {
    name: 'MASSA_STATION',
    checkInstalled: isMassaStationAndWalletPluginInstalled,
    createInstance: () => new MassaStationProvider(),
    isInstalled: false,
  },
];
