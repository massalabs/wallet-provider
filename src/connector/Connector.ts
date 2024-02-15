/**
 * The `Connector` class facilitates communication between 'provider' and 'account' objects and the web page script.
 * It is primarily useful for developers working on this repository.
 */
import { uid } from 'uid';
import { ICustomEventMessageResponse } from './ICustomEventMessageResponse';
import { ICustomEventMessageRequest } from './ICustomEventMessageRequest';
import { IRegisterEvent } from './IRegisterEvent';
import {
  AvailableCommands,
  IAccountBalanceRequest,
  IAccountBalanceResponse,
  IAccountDeletionRequest,
  IAccountDeletionResponse,
  IAccountImportRequest,
  IAccountImportResponse,
  IAccountSignRequest,
  IAccountSignResponse,
} from '..';
import { IAccount } from '../account/IAccount';
import { PluginInfo } from '../massaStation/types';

/**
 * Identifier for the HTML element facilitating communication between the web page script and the content script.
 */
export const MASSA_WINDOW_OBJECT = 'massaWalletProvider';

/**
 * Type definition for a callback function used in handling responses.
 * @param result - The result of the operation, typed as `AllowedResponses`.
 * @param error - An error object if an error occurs, or null if the operation is successful.
 *
 * @returns The return type is unspecified (unknown), as it depends on the implementation of the callback.
 */
type CallbackFunction = (
  result: AllowedResponses,
  error: Error | null,
) => unknown;

export type AllowedRequests =
  | object
  | IAccountBalanceRequest
  | IAccountSignRequest
  | IAccountImportRequest
  | IAccountDeletionRequest;

export type AllowedResponses =
  | object
  | IAccountBalanceResponse
  | IAccountSignResponse
  | IAccountImportResponse
  | IAccountDeletionResponse
  | IAccount[]
  | string;

/**
 * The `Connector` class handles sending and receiving messages to and from the content script.
 */
class Connector {
  private registeredProviders: Record<string, string> = {};
  private pendingRequests: Map<string, CallbackFunction>;

  private providersInfo: Record<string, PluginInfo> = {};

  /**
   * Initializes a new `Connector` instance.
   */
  public constructor() {
    if (typeof document !== 'undefined') {
      this.pendingRequests = new Map<string, CallbackFunction>();
      this.register();

      // start listening to messages from content script
      document
        .getElementById(MASSA_WINDOW_OBJECT)
        .addEventListener(
          'message',
          this.handleResponseFromContentScript.bind(this),
        );
    }
  }

  /**
   * Registers a new provider by creating an HTML element and listener for the register event.
   */
  private register() {
    // global event target to use for all wallet provider
    // check if document exist
    if (typeof document !== 'undefined') {
      if (!document.getElementById(MASSA_WINDOW_OBJECT)) {
        const inv = document.createElement('p');
        inv.id = MASSA_WINDOW_OBJECT;
        inv.setAttribute('style', 'display:none');
        document.body.appendChild(inv);
      }

      // add an invisible HTML element and set a listener to it like the following
      // hook up register handler
      document
        .getElementById(MASSA_WINDOW_OBJECT)
        .addEventListener('register', (evt: CustomEvent) => {
          const payload: IRegisterEvent = evt.detail;
          const providerEventTargetName = `${MASSA_WINDOW_OBJECT}_${payload.providerName}`;
          this.registeredProviders[payload.providerName] =
            providerEventTargetName;
        });
    }
  }

  /**
   * Sends a message to the content script using the specified provider name, command, and parameters.
   *
   * @param providerName - Name of the provider.
   * @param command - Command sent to the content script.
   * @param params - Parameters sent to the content script.
   * @param responseCallback - Callback function for content script responses.
   */
  public sendMessageToContentScript(
    providerName: string,
    command: AvailableCommands,
    params: AllowedRequests,
    responseCallback: CallbackFunction,
  ) {
    if (!Object.values(AvailableCommands).includes(command)) {
      throw new Error(`Unknown command ${command}`);
    }

    const requestId = uid();
    const eventMessageRequest: ICustomEventMessageRequest = {
      params,
      requestId,
    };
    this.pendingRequests.set(requestId, responseCallback);

    // dispatch an event to the specific provider event target
    const specificProviderEventTarget = document?.getElementById(
      `${this.registeredProviders[providerName]}`,
    ) as EventTarget;
    if (!specificProviderEventTarget) {
      throw new Error(
        `Registered provider with name ${providerName} does not exist`,
      );
    }
    const isDispatched = specificProviderEventTarget.dispatchEvent(
      new CustomEvent(command, { detail: eventMessageRequest }),
    );
    if (!isDispatched) {
      throw new Error(
        `Could not dispatch a message to ${this.registeredProviders[providerName]}`,
      );
    }
  }

  /**
   * Retrieves the registered providers.
   *
   * @returns An object mapping provider names to their unique keys.
   */
  public getWalletProviders(): Record<string, string> {
    return this.registeredProviders;
  }

  /**
   * Retrieves information about a specified provider.
   *
   * @param providerName - Name of the provider.
   *
   * @returns Information about the provider, or undefined if not found.
   */
  public getProviderInfo(providerName: string): PluginInfo | undefined {
    return this.providersInfo[providerName];
  }

  /**
   * Handles responses from the content script, invoking the appropriate callback with the response and error data.
   *
   * @param event - Event sent from the content script.
   */
  private handleResponseFromContentScript(event: CustomEvent) {
    const { result, error, requestId }: ICustomEventMessageResponse =
      event.detail;

    const responseCallback: CallbackFunction =
      this.pendingRequests.get(requestId);

    if (responseCallback) {
      if (error) {
        responseCallback(null, new Error(error.message));
      } else {
        responseCallback(result, null);
      }
      const deleted = this.pendingRequests.delete(requestId);
      if (!deleted) {
        console.error(`Error deleting a pending request with id ${requestId}`);
      }
    } else {
      console.error(
        `Request Id ${requestId} not found in response callback map`,
      );
    }
  }
}

export const connector = new Connector();
