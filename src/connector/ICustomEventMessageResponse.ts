import { AllowedResponses } from './Connector';

/**
 * This interface represents the response from the content script to the web page script
 * for an ICustomEventMessageRequest.
 */
export interface ICustomEventMessageResponse {
  result?: AllowedResponses;
  error?: Error;
  requestId: string;
}
