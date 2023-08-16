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

import { MASSA_WINDOW_OBJECT, connector } from './connector/Connector';
import { IProvider } from './provider/IProvider';
import { Provider } from './provider/Provider';
import {
  MASSA_STATION_PROVIDER_NAME,
  MassaStationProvider,
} from './massaStation/MassaStationProvider';
import { detectBearby } from './bearbyWallet/BearbyConnect';
import { BearbyProvider } from './bearbyWallet/BearbyProvider';
import { wait } from './utils/time';

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

/**
 * Get the list of providers that are available to interact with.
 *
 * @param retry - If true, will retry to get the list of providers if none are available.
 * @param pollInterval - The timeout in milliseconds to wait between retries. default is 2000ms.
 * @param timeout - The timeout in milliseconds to wait before giving up. default is 3000ms.
 *
 * @returns An array of providers.
 */
export async function providers(
  retry = true,
  timeout = 3000,
  pollInterval = 500,
): Promise<IProvider[]> {
  const startTime = Date.now();

  await connector.startMassaStationDiscovery();

  let bearby: BearbyProvider | undefined;
  if (await detectBearby()) {
    bearby = new BearbyProvider('BEARBY');
  }

  while (Date.now() - startTime < timeout) {
    const providerInstances: IProvider[] = getProviderInstances();

    if (bearby) providerInstances.push(bearby);

    if (!retry || providerInstances.length > 0) {
      return providerInstances;
    }

    await wait(pollInterval);
  }

  return [];
}

function getProviderInstances() {
  const availableProviders = Object.keys(connector.getWalletProviders());

  const providerInstances: IProvider[] = availableProviders.map(
    (providerName) => {
      if (providerName === MASSA_STATION_PROVIDER_NAME) {
        return new MassaStationProvider();
      } else {
        return new Provider(providerName);
      }
    },
  );
  return providerInstances;
}

/**
 * Manually register a provider to interact with.
 *
 * @param name - The name of the provider.
 * @param id - The id of the HTML element that is used to communicate with the provider.
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

export { connectBearby, disconnectBearby } from './bearbyWallet/BearbyConnect';
