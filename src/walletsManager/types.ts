import { BearbyWallet } from '../bearbyWallet/BearbyWallet';
import { MassaStationWallet } from '../massaStation/MassaStationWallet';

export type WalletInterfaces = (
  | typeof BearbyWallet
  | typeof MassaStationWallet
)[];
