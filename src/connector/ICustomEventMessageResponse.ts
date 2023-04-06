import { AllowedResponses } from './Connector';

export interface ICustomEventMessageResponse {
  result?: AllowedResponses;
  error?: Error;
  requestId: string;
}
