import { Provider } from '../provider/Provider';
import { connector } from '../connector/Connector';
import { providerList } from './providerList';
import { IProvider } from '../provider/IProvider';
import { wait } from '../utils/time';

export async function providers(): Promise<IProvider[]> {
  // Wait for providers to be initialized
  await wait(200);
  return getProvidersInstances();
}

export async function getProvidersInstances(): Promise<IProvider[]> {
  const providerInstances: IProvider[] = [];
  const promises = [];
  for (const provider of providerList) {
    promises.push(async () => {
      try {
        if (await provider.checkInstalled()) {
          providerInstances.push(provider.createInstance());
        }
      } catch (error) {
        console.error(`Error initializing provider ${provider.name}:`, error);
      }
    });
  }

  await Promise.all(promises);

  providerInstances.push(...addCustomProvider(connector));

  return providerInstances;
}

// Custom providers are community provided providers that are not part of the official list.
// But they must implement the wallet provider massa standard.
function addCustomProvider(connector: any): IProvider[] {
  const providerInstances: IProvider[] = [];
  const availableProviders = Object.keys(connector.getWalletProviders());
  availableProviders.forEach((providerName) => {
    providerInstances.push(new Provider(providerName));
  });
  return providerInstances;
}
