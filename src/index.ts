/** Polyfills */
import { Buffer } from 'buffer';

declare global {
  interface Window {
    Buffer: typeof Buffer;
    bearby?: unknown;
  }
}

// Check if we are on browser
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
}

export enum AvailableCommands {
  ProviderListAccounts = 'LIST_ACCOUNTS',
  ProviderDeleteAccount = 'DELETE_ACCOUNT',
  ProviderImportAccount = 'IMPORT_ACCOUNT',
  ProviderGetNodesUrls = 'GET_NODES_URLS',
  ProviderGetNetwork = 'GET_NETWORK',
  ProviderGetChainId = 'GET_CHAIN_ID',
  AccountBalance = 'ACCOUNT_BALANCE',
  AccountSign = 'ACCOUNT_SIGN',
  ProviderGenerateNewAccount = 'GENERATE_NEW_ACCOUNT',
  AccountSellRolls = 'ACCOUNT_SELL_ROLLS',
  AccountBuyRolls = 'ACCOUNT_BUY_ROLLS',
  AccountSendTransaction = 'ACCOUNT_SEND_TRANSACTION',
  AccountCallSC = 'ACCOUNT_CALL_SC',
}

export { AllowedRequests, AllowedResponses } from './connector';

export {
  EAccountDeletionResponse,
  EAccountImportResponse,
  IAccountDeletionRequest,
  IAccountDeletionResponse,
  IAccountImportRequest,
  IAccountImportResponse,
  IProvider,
  Provider,
} from './wallet';

export * from './errors';

export { MassaStationWallet } from './massaStation/MassaStationWallet';

export { MassaStationAccount } from './massaStation/MassaStationAccount';

export { wallets, WalletsListener } from './walletsManager';

export { connectBearby, disconnectBearby } from './bearbyWallet/BearbyConnect';

export {
  isMassaStationAvailable,
  isMassaWalletEnabled,
} from './massaStation/MassaStationDiscovery';
