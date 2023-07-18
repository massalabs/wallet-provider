/** Polyfills */
import { Buffer } from 'buffer';

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

// Check if we are on browser
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

import { connector, MASSA_WINDOW_OBJECT } from './connector/Connector';
import { IProvider } from './provider/IProvider';
import { Provider } from './provider/Provider';
import {
  MASSA_STATION_PROVIDER_NAME,
  MassaStationProvider,
} from './massaStation/MassaStationProvider';

export enum AvailableCommands {
  ProviderListAccounts = 'LIST_ACCOUNTS',
  ProviderDeleteAccount = 'DELETE_ACCOUNT',
  ProviderImportAccount = 'IMPORT_ACCOUNT',
  ProviderGetNodesUrls = 'GET_NODES_URLS',
  AccountBalance = 'ACCOUNT_BALANCE',
  AccountSign = 'ACCOUNT_SIGN',
  ProviderGenerateNewAccount = 'GENERATE_NEW_ACCOUNT',
  AccountSellRolls = 'ACCOUNT_SELL_ROLLS',
  AccountBuyRolls = 'ACCOUNT_BUY_ROLLS',
  AccountSendTransaction = 'ACCOUNT_SEND_TRANSACTION',
  AccountCallSC = 'ACCOUNT_CALL_SC',
}

export interface ITransactionDetails {
  operationId: string;
}

export function providers(): IProvider[] {
  let providers: IProvider[] = [];
  for (const providerName of Object.keys(connector.getWalletProviders())) {
    if (providerName === MASSA_STATION_PROVIDER_NAME) {
      const p = new MassaStationProvider();
      providers.push(p);
    } else {
      const p = new Provider(providerName);
      providers.push(p);
    }
  }
  return providers;
}

/**
 * Register a provider to interact with the wallet.
 *
 * @param name - The name of the provider.
 */
export function registerProvider(name: string, id = MASSA_WINDOW_OBJECT): void {
  const registerEvent = new CustomEvent('register', {
    detail: { providerName: name },
  });
  const element = document.getElementById(id);
  if (element) {
    element.dispatchEvent(registerEvent);
  }
}

export { AllowedRequests, AllowedResponses } from './connector';

export {
  IAccountDetails,
  IAccountBalanceRequest,
  IAccountBalanceResponse,
  IAccountSignRequest,
  IAccountSignResponse,
  IAccount,
  Account,
  IAccountRollsRequest,
  IAccountSendTransactionRequest,
  IAccountCallSCRequest,
} from './account';

export {
  EAccountDeletionResponse,
  EAccountImportResponse,
  IAccountDeletionRequest,
  IAccountDeletionResponse,
  IAccountImportRequest,
  IAccountImportResponse,
  IProvider,
  Provider,
} from './provider';

export { IMassaStationWallet } from './massaStation/MassaStationProvider';

export { MassaStationAccount } from './massaStation/MassaStationAccount';
