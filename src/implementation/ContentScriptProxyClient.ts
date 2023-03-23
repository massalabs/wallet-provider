import uuid4 from 'uuid4';
import { ICustomEventMessageResponse } from '../interfaces/ICustomEventMessageResponse';
import { ICustomEventMessageRequest } from '../interfaces/ICustomEventMessageRequest';
import { AvailableCommands } from './Commands';
import { IRegisterEvent } from '../interfaces';

const MASSA_WINDOW_OBJECT_PRAEFIX = 'massaWalletProvider';

type CallbackFunctionVariadicAnyReturn = (
  error: Error | null,
  result: any,
) => any;

// =========================================================

export class ContentScriptProxyClient {
  private static instance: ContentScriptProxyClient;
  private registeredProviders: { [key: string]: string } = {};
  private pendingRequests: Map<string, CallbackFunctionVariadicAnyReturn>;

  public static getInstance(): ContentScriptProxyClient {
    if (!ContentScriptProxyClient.instance) {
      ContentScriptProxyClient.instance = new ContentScriptProxyClient();
    }

    return ContentScriptProxyClient.instance;
  }

  private constructor() {
    this.pendingRequests = new Map<string, CallbackFunctionVariadicAnyReturn>();

    // global event target to use for all wallet provider
    window.massaWalletProvider = new EventTarget();

    // hook up register handler
    (window.massaWalletProvider as EventTarget).addEventListener(
      'register',
      (evt: CustomEvent) => {
        const payload: IRegisterEvent = evt.detail;
        console.log('Registration payload', payload);
        const extensionEventTarget = new EventTarget();
        window[`${MASSA_WINDOW_OBJECT_PRAEFIX}-${payload.eventTarget}`] =
          extensionEventTarget;
        this.registeredProviders[payload.providerName] = payload.eventTarget;
      },
    );

    // start listening to messages from content script
    (window.massaWalletProvider as EventTarget).addEventListener(
      'message',
      this.handleResponseFromContentScript,
    );

    this.getWalletProviders = this.getWalletProviders.bind(this);
    this.handleResponseFromContentScript =
      this.handleResponseFromContentScript.bind(this);
    this.sendMessageToContentScript =
      this.sendMessageToContentScript.bind(this);
  }

  // send a message from the webpage script to the content script
  public sendMessageToContentScript(
    providerName: string,
    command: AvailableCommands,
    params: object,
    responseCallback: CallbackFunctionVariadicAnyReturn,
  ) {
    const requestId = uuid4();
    const eventMessageRequest: ICustomEventMessageRequest = {
      params,
      requestId,
    };
    this.pendingRequests.set(requestId, responseCallback);

    if (!Object.values(AvailableCommands).includes(command)) {
      throw new Error(`Unknown command ${command}`);
    }

    // dispatch an event to the window specific provider object
    (
      (window as any)[
        `${MASSA_WINDOW_OBJECT_PRAEFIX}-${this.registeredProviders[providerName]}`
      ] as EventTarget
    ).dispatchEvent(new CustomEvent(command, { detail: eventMessageRequest }));
  }

  public getWalletProviders(): object {
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
    }
  }
}
