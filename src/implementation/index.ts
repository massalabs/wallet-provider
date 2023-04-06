import { connector } from './Connector';
import { Provider } from './Provider';

export function providers(): Provider[] {
  let providers: Provider[] = [];
  for (const providerName of Object.keys(connector.getWalletProviders())) {
    const p = new Provider(providerName);
    providers.push(p);
  }
  return providers;
}

export { Account } from './Account';
export { Provider } from './Provider';
