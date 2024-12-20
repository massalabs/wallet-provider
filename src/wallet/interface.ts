import { Network, Provider } from '@massalabs/massa-web3';
import { ListenerCtrl, WalletName } from './types';

export interface Wallet {
  name(): WalletName;
  accounts(): Promise<Provider[]>;
  importAccount(publicKey: string, privateKey: string): Promise<void>;
  deleteAccount(address: string): Promise<void>;
  networkInfos(): Promise<Network>;
  setRpcUrl(url: string): Promise<void>;
  generateNewAccount(name: string): Promise<Provider>;
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  connected(): Promise<boolean>;
  enabled(): boolean;
  listenAccountChanges(
    callback: (address: string) => void,
  ): ListenerCtrl | undefined;
  listenNetworkChanges(
    callback: (network: Network) => void,
  ): ListenerCtrl | undefined;
}
