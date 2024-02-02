import { IProvider } from '../provider/IProvider';
import { providers } from './providers';

export class ProvidersListener {
  private intervalDelay: number;
  private intervalId: NodeJS.Timeout | null;
  private currentProviders: IProvider[] = [];

  constructor(intervalDelay: number = 1000) {
    this.intervalDelay = intervalDelay;
  }

  private async checkForChanges(
    callback: (providers: IProvider[]) => void,
  ): Promise<void> {
    try {
      const newProviders = await providers();
      if (this.hasProvidersChanged(newProviders)) {
        this.currentProviders = newProviders;
        callback(newProviders);
      }
    } catch (error) {
      console.error('Error checking provider changes:', error);
    }
  }

  private hasProvidersChanged(newProviders: IProvider[]): boolean {
    const newProviderNameSet = new Set(newProviders.map((p) => p.name));
    const currentProviderNameSet = new Set(
      this.currentProviders.map((p) => p.name),
    );

    if (newProviderNameSet.size !== currentProviderNameSet.size) {
      return true;
    }

    for (let providerName of newProviderNameSet) {
      if (!currentProviderNameSet.has(providerName)) {
        return true;
      }
    }

    return false;
  }

  public async subscribe(
    callback: (providers: IProvider[]) => void,
  ): Promise<{ unsubscribe: () => void }> {
    this.currentProviders = await providers();
    callback(this.currentProviders);

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
