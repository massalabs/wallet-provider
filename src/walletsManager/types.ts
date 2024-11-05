import { MetamaskWallet } from '../metamaskSnap/MetamaskWallet';
import { BearbyWallet } from '../bearbyWallet/BearbyWallet';
import { MassaStationWallet } from '../massaStation/MassaStationWallet';

export type WalletInterfaces = (
  | typeof BearbyWallet
  | typeof MassaStationWallet
  | typeof MetamaskWallet
)[];
