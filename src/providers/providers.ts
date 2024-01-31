import { Provider } from '../provider/Provider';
import { connector } from '../connector/Connector';
import { providerList } from './providerList';
import { IProvider } from 'src/provider/IProvider';

export async function providers(): Promise<IProvider[]> {
  const providerInstances: IProvider[] = [];

  for (const provider of providerList) {
    try {
      if (await provider.checkInstalled()) {
        provider.isInstalled = true;
        providerInstances.push(provider.createInstance());
      }
    } catch (error) {
      console.error(`Error initializing provider ${provider.name}:`, error);
    }
  }

  providerInstances.push(...addCustomProvider(connector));

  return providerInstances;
}

// Custom providers are community provided providers that are not part of the official list.
// But they must implement the wallet provider massa standard.
function addCustomProvider(connector: any): any[] {
  const providerInstances: any[] = [];
  const availableProviders = Object.keys(connector.getWalletProviders());
  availableProviders.forEach((providerName) => {
    providerInstances.push(new Provider(providerName));
  });
  return providerInstances;
}
