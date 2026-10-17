import { WalletName } from './types';

export const WalletInstallLink: Record<WalletName, string> = {
  [WalletName.Bearby]: 'https://bearby.io',
  [WalletName.MassaWallet]: 'https://station.massa.net/',
  [WalletName.Metamask]:
    'https://snaps.metamask.io/snap/npm/massalabs/metamask-snap/',
  [WalletName.RustCore]:
    'https://github.com/RustCoreMassa/rust-core-wallet/releases/latest',
};
