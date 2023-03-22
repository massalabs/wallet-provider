import uuid4 from 'uuid4';
import { IMessage } from './interfaces/IMessage';

export * as models from './interfaces/index';

type CallbackFunctionVariadicAnyReturn = (...args: any[]) => any;

const availableCommands = [
  'ListAccounts',
  'DeleteAccount',
  'ImportAccount',
  'Balance',
  'Sign',
];

// storage
let registeredProviders = {};
const pendingRequests = new Map<string, CallbackFunctionVariadicAnyReturn>();

// global event target to use for all wallet provider
window.massaWalletProvider = new EventTarget();

// Register
window.massaWalletProvider.addEventListener('register', (payload) => {
  const extensionEventTarget = new EventTarget();
  window[`massaWalletProvider-${payload.eventTarget}`] = extensionEventTarget;
  registeredProviders[payload.providerName] = payload.eventTarget;
});

// send a message from the webpage script to the content script
export function sendMessageToContentScript(
  provider,
  command,
  params,
  responseCallback,
) {
  const requestId = uuid4();
  const message: IMessage = { params, requestId };
  pendingRequests.set(requestId, responseCallback);

  if (!availableCommands.includes(command)) {
    throw new Error('Unhandled command');
  }

  (window as any)[
    `massaWalletProvider-${registeredProviders[provider]}`
  ].dispatchEvent(new CustomEvent(command, { detail: message }));
}

// receive a response from the content script
export function handleResponseFromContentScript(event) {
  const { result, error, requestId } = event.detail;
  const responseCallback = pendingRequests.get(requestId);

  if (responseCallback) {
    if (error) {
      responseCallback(new Error(error));
    } else {
      responseCallback(null, result);
    }
    pendingRequests.delete(requestId);
  }
}

export function getWalletProviders(): object {
  return registeredProviders;
}

window.massaWalletProvider.addEventListener(
  'message',
  handleResponseFromContentScript,
);
