import { AllowedResponses } from './Connector';

/**
 * Represents the response from the content script to the web page script
 * following an `ICustomEventMessageRequest`.
 */
export interface ICustomEventMessageResponse {
  /** The result of the request, defined by `AllowedResponses` type. */
  result?: AllowedResponses;

  /** Any error that occurred during the request processing. */
  error?: Error;

  /** The unique identifier of the request. */
  requestId: string;
}
