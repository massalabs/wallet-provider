import { AllowedRequests } from './Connector';

export interface ICustomEventMessageRequest {
  params: AllowedRequests;
  requestId: string;
}
