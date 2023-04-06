import { connector } from './connector/Connector';
import { Provider } from './provider/Provider';

export enum AvailableCommands {
  ProviderListAccounts = 'LIST_ACCOUNTS',
  ProviderDeleteAccount = 'DELETE_ACCOUNT',
  ProviderImportAccount = 'IMPORT_ACCOUNT',
  AccountBalance = 'ACCOUNT_BALANCE',
  AccountSign = 'ACCOUNT_SIGN',
}

export function providers(): Provider[] {
  let providers: Provider[] = [];
  for (const providerName of Object.keys(connector.getWalletProviders())) {
    const p = new Provider(providerName);
    providers.push(p);
  }
  return providers;
}

export { AllowedRequests, AllowedResponses } from './connector';

export {
  IAccount,
  IAccountBalanceRequest,
  IAccountBalanceResponse,
  IAccountSignRequest,
  IAccountSignResponse,
} from './account';

export {
  EAccountDeletionResponse,
  EAccountImportResponse,
  IAccountDeletionRequest,
  IAccountDeletionResponse,
  IAccountImportRequest,
  IAccountImportResponse,
} from './provider';
