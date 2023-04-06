import { uid } from 'uid';
import { ICustomEventMessageResponse } from '../interfaces/ICustomEventMessageResponse';
import { ICustomEventMessageRequest } from '../interfaces/ICustomEventMessageRequest';
import { AvailableCommands } from './Commands';
import { IRegisterEvent } from '../interfaces';

const MASSA_WINDOW_OBJECT = 'massaWalletProvider';

type CallbackFunctionVariadicAnyReturn = (
  error: Error | null,
  result: any,
) => any;

// =========================================================

class Connector {
  private registeredProviders: { [key: string]: string } = {};
  private pendingRequests: Map<string, CallbackFunctionVariadicAnyReturn>;

  public constructor() {
    this.pendingRequests = new Map<string, CallbackFunctionVariadicAnyReturn>();
    this.register();

    // start listening to messages from content script
    document
      .getElementById(MASSA_WINDOW_OBJECT)
      .addEventListener('message', this.handleResponseFromContentScript);
  }

  private register() {
    // global event target to use for all wallet provider
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

  // send a message from the webpage script to the content script
  public sendMessageToContentScript(
    providerName: string,
    command: AvailableCommands,
    params: object,
    responseCallback: CallbackFunctionVariadicAnyReturn,
  ) {
    const requestId = uid();
    const eventMessageRequest: ICustomEventMessageRequest = {
      params,
      requestId,
    };
    this.pendingRequests.set(requestId, responseCallback);

    if (!Object.values(AvailableCommands).includes(command)) {
      throw new Error(`Unknown command ${command}`);
    }

    // dispatch an event to the specific provider event target
    const specificProviderEventTarget = document.getElementById(
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

  public getWalletProviders(): { [key: string]: string } {
    return this.registeredProviders;
  }

  // receive a response from the content script
  private handleResponseFromContentScript(event: CustomEvent) {
    const { result, error, requestId }: ICustomEventMessageResponse =
      event.detail;

    const responseCallback = this.pendingRequests.get(requestId);

    if (responseCallback) {
      if (error) {
        responseCallback(new Error(error.message), null);
      } else {
        responseCallback(null, result);
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
