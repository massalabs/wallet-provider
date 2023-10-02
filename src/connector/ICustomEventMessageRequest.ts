import { AllowedRequests } from './Connector';

/**
 * Represents a request sent from the web page script to the content script
 * to initiate a custom event.
 *
 * @remarks
 * The request is used for setting up communication for a specific operation,
 * identified by a unique `requestId`.
 */
export interface ICustomEventMessageRequest {
  /** Parameters for the request, conforming to allowed request types. */
  params: AllowedRequests;

  /** Unique identifier for the request. */
  requestId: string;
}
