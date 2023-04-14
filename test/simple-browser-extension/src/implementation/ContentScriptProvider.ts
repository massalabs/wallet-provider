import { AvailableCommands } from './Commands';
import {
  IAccountBalanceRequest,
  IAccountBalanceResponse,
  IAccountSignRequest,
  IAccountSignResponse,
  IAccountDeletionRequest,
  IAccountDeletionResponse,
  IAccountImportRequest,
  IAccountImportResponse,
} from '../operations';
import {
  ICustomEventMessageRequest,
  IRegisterEvent,
  ICustomEventMessageResponse,
  IAccount,
} from '../interfaces';

declare function cloneInto<T>(object: T, targetScope: any): T;

const MASSA_WINDOW_OBJECT = 'massaWalletProvider';

type CallbackFunction = (evt: ICustomEventMessageRequest) => void;

// =========================================================
const detailWrapper = (detail) => {
  if (typeof cloneInto === 'function') {
    return cloneInto(detail, window);
  }
  return detail;
};

export abstract class ContentScriptProvider {
  private providerName: string;
  private actionToCallback: Map<string, CallbackFunction>;

  public abstract sign(payload: IAccountSignRequest): IAccountSignResponse;
  public abstract balance(
    payload: IAccountBalanceRequest,
  ): IAccountBalanceResponse;
  public abstract deleteAccount(
    payload: IAccountDeletionRequest,
  ): IAccountDeletionResponse;
  public abstract importAccount(
    payload: IAccountImportRequest,
  ): IAccountImportResponse;
  public abstract listAccounts(): IAccount[];

  public constructor(providerName: string) {
    this.providerName = providerName;
    this.actionToCallback = new Map<string, CallbackFunction>();
    this.attachCallbackHandler = this.attachCallbackHandler.bind(this);

    this.sign = this.sign.bind(this);
    this.balance = this.balance.bind(this);
    this.deleteAccount = this.deleteAccount.bind(this);
    this.importAccount = this.importAccount.bind(this);
    this.listAccounts = this.listAccounts.bind(this);

    // this is the current provider html element
    const providerEventTargetName = `${MASSA_WINDOW_OBJECT}_${this.providerName}`;
    if (!document.getElementById(providerEventTargetName)) {
      const inv = document.createElement('p');
      inv.id = providerEventTargetName;
      document.body.appendChild(inv);
    }

    const walletProviderEventTarget = document.getElementById(
      MASSA_WINDOW_OBJECT,
    ) as EventTarget;
    if (!walletProviderEventTarget) {
      throw new Error(`Wallet Provider Event Target html element with id ${MASSA_WINDOW_OBJECT} not created. 
      Make sure your "massa-wallet-provider" is already initialized`);
    }

    // ======================SIGN===============================
    // and how the content script listen for commands
    (
      document.getElementById(providerEventTargetName) as EventTarget
    ).addEventListener(AvailableCommands.AccountSign, (evt: CustomEvent) => {
      const payload: ICustomEventMessageRequest = evt.detail;
      this.actionToCallback.get(AvailableCommands.AccountSign)(payload);
    });

    // attach handlers for various methods
    this.attachCallbackHandler(
      AvailableCommands.AccountSign,
      async (payload: ICustomEventMessageRequest) => {
        const accountSignPayload = payload.params as IAccountSignRequest;
        const respMessage = {
          result: await this.sign(accountSignPayload),
          error: null,
          requestId: payload.requestId,
        } as ICustomEventMessageResponse;
        // answer to the message target
        walletProviderEventTarget.dispatchEvent(
          new CustomEvent('message', detailWrapper({ detail: respMessage })),
        );
      },
    );

    // ===========================BALANCE============================
    (
      document.getElementById(providerEventTargetName) as EventTarget
    ).addEventListener(AvailableCommands.AccountBalance, (evt: CustomEvent) => {
      const payload: ICustomEventMessageRequest = evt.detail;
      this.actionToCallback.get(AvailableCommands.AccountBalance)(payload);
    });

    this.attachCallbackHandler(
      AvailableCommands.AccountBalance,
      async (payload: ICustomEventMessageRequest) => {
        const accountBalancePayload = payload.params as IAccountBalanceRequest;
        const respMessage = {
          result: await this.balance(accountBalancePayload),
          error: null,
          requestId: payload.requestId,
        } as ICustomEventMessageResponse;
        // answer to the message target
        walletProviderEventTarget.dispatchEvent(
          new CustomEvent('message', detailWrapper({ detail: respMessage })),
        );
      },
    );
    // ============================DELETE ACCOUNT============================
    (
      document.getElementById(providerEventTargetName) as EventTarget
    ).addEventListener(
      AvailableCommands.ProviderDeleteAccount,
      (evt: CustomEvent) => {
        const payload: ICustomEventMessageRequest = evt.detail;
        this.actionToCallback.get(AvailableCommands.ProviderDeleteAccount)(
          payload,
        );
      },
    );

    this.attachCallbackHandler(
      AvailableCommands.ProviderDeleteAccount,
      async (payload: ICustomEventMessageRequest) => {
        const accountDeletionPayload =
          payload.params as IAccountDeletionRequest;
        const respMessage = {
          result: await this.deleteAccount(accountDeletionPayload),
          error: null,
          requestId: payload.requestId,
        } as ICustomEventMessageResponse;
        // answer to the message target
        walletProviderEventTarget.dispatchEvent(
          new CustomEvent('message', detailWrapper({ detail: respMessage })),
        );
      },
    );

    // =============================IMPORT ACCOUNT===================================
    (
      document.getElementById(providerEventTargetName) as EventTarget
    ).addEventListener(
      AvailableCommands.ProviderImportAccount,
      (evt: CustomEvent) => {
        const payload: ICustomEventMessageRequest = evt.detail;
        this.actionToCallback.get(AvailableCommands.ProviderImportAccount)(
          payload,
        );
      },
    );

    this.attachCallbackHandler(
      AvailableCommands.ProviderImportAccount,
      async (payload: ICustomEventMessageRequest) => {
        const accountImportPayload = payload.params as IAccountImportRequest;
        const respMessage = {
          result: await this.importAccount(accountImportPayload),
          error: null,
          requestId: payload.requestId,
        } as ICustomEventMessageResponse;
        // answer to the message target
        walletProviderEventTarget.dispatchEvent(
          new CustomEvent('message', detailWrapper({ detail: respMessage })),
        );
      },
    );
    // ==============================LIST ACCOUNTS==================================
    (
      document.getElementById(providerEventTargetName) as EventTarget
    ).addEventListener(
      AvailableCommands.ProviderListAccounts,
      (evt: CustomEvent) => {
        const payload: ICustomEventMessageRequest = evt.detail;
        this.actionToCallback.get(AvailableCommands.ProviderListAccounts)(
          payload,
        );
      },
    );

    this.attachCallbackHandler(
      AvailableCommands.ProviderListAccounts,
      async (payload: ICustomEventMessageRequest) => {
        const respMessage = {
          result: await this.listAccounts(),
          error: null,
          requestId: payload.requestId,
        } as ICustomEventMessageResponse;
        // answer to the message target
        walletProviderEventTarget.dispatchEvent(
          new CustomEvent('message', detailWrapper({ detail: respMessage })),
        );
      },
    );
    // ================================================================
  }

  private attachCallbackHandler(
    methodName: string,
    callback: (payload: ICustomEventMessageRequest) => void,
  ): void {
    this.actionToCallback.set(methodName, callback);
  }

  public static async registerAsMassaWalletProvider(
    providerName: string,
  ): Promise<boolean> {
    return withTimeoutRejection<boolean>(
      new Promise((resolve) => {
        const registerProvider = () => {
          if (!document.getElementById(MASSA_WINDOW_OBJECT)) {
            return resolve(false);
          }

          // answer to the register target
          const isRegisterEventSent = document
            .getElementById(MASSA_WINDOW_OBJECT)
            .dispatchEvent(
              new CustomEvent(
                'register',
                detailWrapper({
                  detail: {
                    providerName: providerName,
                    eventTarget: providerName,
                  } as IRegisterEvent,
                }),
              ),
            );
          return resolve(isRegisterEventSent);
        };

        if (
          document.readyState === 'complete' ||
          document.readyState === 'interactive'
        ) {
          registerProvider();
        } else {
          document.addEventListener('DOMContentLoaded', registerProvider);
        }
      }),
      5000,
    );
  }
}

async function withTimeoutRejection<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  const sleep = new Promise((resolve, reject) =>
    setTimeout(
      () =>
        reject(
          new Error(
            `Timeout of ${timeoutMs} has passed and promise did not resolve`,
          ),
        ),
      timeoutMs,
    ),
  );
  return Promise.race([promise, sleep]) as Promise<T>;
}

export async function registerAndInitProvider<T extends ContentScriptProvider>(
  Clazz: new (providerName: string) => T,
  providerName: string,
): Promise<void> {
  const isProviderRegistered =
    await ContentScriptProvider.registerAsMassaWalletProvider(providerName);
  // create an instance of the extension for communication
  if (isProviderRegistered) {
    new Clazz(providerName);
  }
}
