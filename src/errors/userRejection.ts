import { BaseError } from './base';

export type UserRejectionErrorType = UserRejectionError & {
  name: 'UserRejectionError';
};

export class UserRejectionError extends BaseError {
  override name = 'UserRejectionError';

  constructor({ operationName }) {
    super(`The operation ${operationName} was rejected by the user.`);
  }
}
