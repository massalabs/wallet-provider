import { AllowedRequests } from './Connector';

/**
 * This interface represents the request done by the web page script to the content script
 * in order to setup a custom event.
 */
export interface ICustomEventMessageRequest {
  params: AllowedRequests;
  requestId: string;
}
