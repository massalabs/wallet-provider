export interface IAccountDeletionRequest {
  address: string;
}

export interface IAccountDeletionResponse {
  response: EAccountDeletionResponse;
}

export enum EAccountDeletionResponse {
  OK,
  REFUSED,
  ERROR,
}
