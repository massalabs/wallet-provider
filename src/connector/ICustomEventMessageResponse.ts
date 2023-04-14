import { AllowedResponses } from './Connector';

/**
 * This interface represents the response sent by the content script to the web page script.
 * It is used to send back the result of a "ICustomEventMessageRequest" request.
 */
export interface ICustomEventMessageResponse {
  result?: AllowedResponses;
  error?: Error;
  requestId: string;
}
