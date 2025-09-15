import {
  deleteRequest,
  getRequest,
  postRequest,
  putRequest,
} from './RequestHandler';
import { MassaStationAccount } from './MassaStationAccount';
import {
  AddUpdateSignRuleResponse,
  Config,
  MassaStationAccountStatus,
  MSAccount,
  MSAccountsResp,
  SignRule,
} from './types';
import { EventEmitter } from 'eventemitter3';
import { Wallet } from '../wallet/interface';
import { Network } from '@massalabs/massa-web3';
import { networkInfos } from './utils/network';
import { WalletName } from '../wallet';
import { isMassaWalletEnabled } from './MassaStationDiscovery';
import { isStandalone } from './utils/standalone';

/**
 * MassaStation url
 */
export const MASSA_STATION_URL = 'https://station.massa/';

const NETWORK_CHECK_INTERVAL = 4000;

/**
 * The MassaStation accounts url
 */

export function walletApiUrl(): string {
  // This is a hack to detect that MS wallet is working in standalone mode
  if (isStandalone()) {
    return `http://localhost:8080/api`;
  }
  return `${MASSA_STATION_URL}plugin/massa-labs/massa-wallet/api`;
}
/**
 * Events emitted by MassaStation
 */
const MASSA_STATION_NETWORK_CHANGED = 'MASSA_STATION_NETWORK_CHANGED';

/**
 * This class provides an implementation for communicating with the MassaStation wallet.
 * @remarks
 * This class is used as a proxy to the MassaStation server for exchanging message over https calls.
 */
export class MassaStationWallet implements Wallet {
  private walletName = WalletName.MassaWallet;

  private eventsListener = new EventEmitter();
  private currentNetwork: Network;

  public name(): WalletName {
    return this.walletName;
  }

  static async createIfInstalled(): Promise<Wallet | null> {
    if (isStandalone() || (await isMassaWalletEnabled())) {
      return new MassaStationWallet();
    }
    return null;
  }

  public async accounts(): Promise<MassaStationAccount[]> {
    const res = await getRequest<MSAccountsResp>(walletApiUrl() + '/accounts');

    return res.result
      .filter((account) => {
        return account.status === MassaStationAccountStatus.OK;
      })
      .map((account) => {
        return new MassaStationAccount(account.address, account.nickname);
      });
  }

  public async importAccount(
    publicKey: string,
    privateKey: string,
  ): Promise<void> {
    await putRequest(walletApiUrl() + '/accounts', {
      publicKey,
      privateKey,
    });
  }

  public async deleteAccount(address: string): Promise<void> {
    // get all accounts and find the account to delete
    const allAccounts = await getRequest<MSAccountsResp>(
      walletApiUrl() + '/accounts',
    );

    const accountToDelete = allAccounts.result.find(
      (account) => account.address === address,
    );

    if (!accountToDelete) {
      throw new Error('Account not found');
    }

    await deleteRequest<unknown>(
      `${walletApiUrl()}/accounts/${accountToDelete.nickname}`,
    );
  }

  public async networkInfos(): Promise<Network> {
    return networkInfos();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async setRpcUrl(url: string): Promise<void> {
    throw new Error(
      'setRpcUrl is not yet implemented for the current provider.',
    );
  }

  /**
   * This method sends an http call to the MassaStation server to create a new random account.
   *
   * @returns a Promise that resolves to the details of the newly generated account.
   */
  public async generateNewAccount(name: string): Promise<MassaStationAccount> {
    const response = await postRequest<MSAccount>(
      walletApiUrl() + '/accounts/' + name,
      {},
    );

    return new MassaStationAccount(
      response.result.address,
      response.result.nickname,
    );
  }

  public listenAccountChanges(): { unsubscribe: () => void } | undefined {
    throw new Error(
      'listenAccountChanges is not yet implemented for the current provider.',
    );
  }

  public listenNetworkChanges(
    callback: (network: Network) => void,
  ): { unsubscribe: () => void } | undefined {
    this.eventsListener.on(MASSA_STATION_NETWORK_CHANGED, (evt) =>
      callback(evt),
    );

    // check periodically if network changed
    const intervalId = setInterval(async () => {
      const network = await this.networkInfos();
      if (!this.currentNetwork) {
        this.currentNetwork = network;
        return;
      }
      if (this.currentNetwork.name !== network.name) {
        this.currentNetwork = network;
        this.eventsListener.emit(MASSA_STATION_NETWORK_CHANGED, network);
      }
    }, NETWORK_CHECK_INTERVAL);

    return {
      unsubscribe: () => {
        clearInterval(intervalId);
        this.eventsListener.removeListener(
          MASSA_STATION_NETWORK_CHANGED,
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          () => {},
        );
      },
    };
  }

  /**
   * Simulates connecting to the station.
   * This method always returns `true` because the station is inherently connected.
   */
  public async connect(): Promise<boolean> {
    return true;
  }

  /**
   * Simulates disconnecting from the station.
   * This method always returns `true` because the station cannot be disconnected.
   */
  public async disconnect(): Promise<boolean> {
    return true;
  }

  /**
   * Indicates if the station is connected.
   * Always returns `true` because the station is always connected when running.
   */
  public async connected(): Promise<boolean> {
    return true;
  }

  /**
   * Indicates if the station is enabled.
   * Always returns `true` because the station is always enabled by default.
   */
  public enabled(): boolean {
    return true;
  }
  /**
   * Retrieves the configuration from the MS Wallet api.
   *
   * @returns The configuration of MS wallet.
   */
  public async getConfig(): Promise<Config> {
    const { result } = await getRequest<Config>(walletApiUrl() + '/config');
    return result;
  }

  /**
   * Adds a new signing rule to the MassaStation wallet.
   *
   * @param accountName - The name of the account.
   * @param rule - The signing rule to add.
   * @param desc - Custom description of the new rule creation.
   * @returns A Promise that resolves when the rule is successfully added.
   */
  public async addSignRule(
    accountName: string,
    rule: SignRule,
    desc?: string,
  ): Promise<AddUpdateSignRuleResponse> {
    const { result } = await postRequest<AddUpdateSignRuleResponse>(
      walletApiUrl() + '/accounts/' + accountName + '/signrules',
      {
        description: desc,
        name: rule.name,
        ruleType: rule.ruleType,
        contract: rule.contract,
        enabled: rule.enabled,
        authorizedOrigin: rule.authorizedOrigin,
      },
    );
    return result;
  }

  /**
   * Edits an existing signing rule in the MassaStation wallet.
   * Modifying the contract or ruleType will result in a new rule being created with a new Id.
   *
   * @param accountName - The name of the account.
   * @param rule - The updated signing rule.
   * @param desc - Custom description of the rule update.
   * @returns A Promise that resolves when the rule is successfully edited.
   */
  public async editSignRule(
    accountName: string,
    rule: SignRule,
    desc?: string,
  ): Promise<AddUpdateSignRuleResponse> {
    const { result } = await putRequest<AddUpdateSignRuleResponse>(
      walletApiUrl() + '/accounts/' + accountName + '/signrules/' + rule.id,
      {
        description: desc,
        name: rule.name,
        ruleType: rule.ruleType,
        contract: rule.contract,
        enabled: rule.enabled,
      },
    );

    return result;
  }

  /**
   * Deletes a signing rule from the MassaStation wallet.
   *
   * @param accountName - The name of the account.
   * @param ruleId - The Id of the sign rule.
   * @returns A Promise that resolves when the rule is successfully deleted.
   */
  public async deleteSignRule(
    accountName: string,
    ruleId: string,
  ): Promise<void> {
    await deleteRequest(
      walletApiUrl() + '/accounts/' + accountName + '/signrules/' + ruleId,
    );
  }
}
