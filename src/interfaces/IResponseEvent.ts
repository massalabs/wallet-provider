export interface IResponseEvent {
  detail: IEventDetail;
}

export interface IEventDetail {
  result?: any;
  error?: Error;
  requestId: string;
}
