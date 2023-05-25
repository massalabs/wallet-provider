import { connector } from './connector/Connector';
import { IProvider } from './provider/IProvider';
import { Provider } from './provider/Provider';
import { THYRA_PROVIDER_NAME, ThyraProvider } from './thyra/ThyraProvider';

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
  AccountInteractWithSC = 'ACCOUNT_INTERACT_WITH_SC',
}

export interface ITransactionDetails {
  operationId: string;
}

export function providers(): IProvider[] {
  let providers: IProvider[] = [];
  for (const providerName of Object.keys(connector.getWalletProviders())) {
    if (providerName === THYRA_PROVIDER_NAME) {
      const p = new ThyraProvider();
      providers.push(p);
    } else {
      const p = new Provider(providerName);
      providers.push(p);
    }
  }
  return providers;
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
  IAccountInteractWithSCRequest,
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

export {
  IThyraWallet,
} from './thyra/ThyraProvider';

export {
  ThyraAccount,
} from './thyra/ThyraAccount';
