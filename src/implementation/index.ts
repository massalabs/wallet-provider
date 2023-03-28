import { ContentScriptProxyClient } from './ContentScriptProxyClient';
import { Provider } from './Provider';

export function providers(): Provider[] {
  let providers: Provider[] = [];
  for (const providerName of Object.keys(
    ContentScriptProxyClient.getInstance().getWalletProviders(),
  )) {
    const p = new Provider(providerName);
    providers.push(p);
  }
  return providers;
}

export { Account } from './Account';
export { Provider } from './Provider';
export { ContentScriptProxyClient } from './ContentScriptProxyClient';
