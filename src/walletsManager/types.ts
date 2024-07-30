import { Wallet } from '../wallet/interface';

export type SupportedWallet = {
  name: string;
  checkInstalled: () => Promise<boolean>;
  createInstance: () => Wallet;
};
