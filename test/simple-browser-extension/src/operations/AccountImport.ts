export interface IAccountImportRequest {
  privateKey: string;
  publicKey: string;
}

export interface IAccountImportResponse {
  response: EAccountImportResponse;
  message: string;
}

export enum EAccountImportResponse {
  OK,
  REFUSED,
  ERROR,
}
