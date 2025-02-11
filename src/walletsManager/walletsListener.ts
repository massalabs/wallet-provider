import { Wallet } from '../wallet/interface';
import { getWallets } from './walletList';

export class WalletsListener {
  private intervalId: NodeJS.Timeout | null;
  private currentWallets: Wallet[] = [];

  constructor(public intervalDelay = 1000) {}

  private async checkForChanges(
    callback: (wallets: Wallet[]) => void,
  ): Promise<void> {
    try {
      const newWallets = await getWallets(0);
      if (this.hasWalletsChanged(newWallets)) {
        this.currentWallets = newWallets;
        callback(newWallets);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error checking wallet list changes:', error);
    }
  }

  private hasWalletsChanged(newWallets: Wallet[]): boolean {
    const newList = new Set(newWallets.map((p) => p.name));
    const currentList = new Set(this.currentWallets.map((p) => p.name));

    if (
      newList.size !== currentList.size ||
      [...newList].some((name) => !currentList.has(name))
    ) {
      return true;
    }

    return false;
  }

  public async subscribe(
    callback: (wallets: Wallet[]) => void,
  ): Promise<{ unsubscribe: () => void }> {
    this.currentWallets = await getWallets();
    callback(this.currentWallets);

    this.intervalId = setInterval(
      () => this.checkForChanges(callback),
      this.intervalDelay,
    );

    return {
      unsubscribe: () => {
        if (this.intervalId) {
          clearInterval(this.intervalId);
        }
      },
    };
  }
}
