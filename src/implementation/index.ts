import { MassaWalletProviders } from './MassaWalletProviders';
import { Provider } from './Provider';

export function providers(): Provider[] {
  let providers: Provider[] = [];
  for (const providerName of Object.keys(
    MassaWalletProviders.init().getWalletProviders(),
  )) {
    const p = new Provider(providerName);
    providers.push(p);
  }
  return providers;
}

export { Account } from './Account';
export { Provider } from './Provider';
export { MassaWalletProviders } from './MassaWalletProviders';
