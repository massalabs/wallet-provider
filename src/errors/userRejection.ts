import { BaseError } from './base';
import { ErrorCodes } from './utils/codes';

export type UserRejectionErrorType = UserRejectionError & {
  name: 'UserRejectionError';
};

export class UserRejectionError extends BaseError {
  override name = 'UserRejectionError';

  constructor({
    operationName,
    cause,
  }: {
    operationName: string;
    cause?: Error;
  }) {
    super(`The operation ${operationName} was rejected by the user.`, {
      code: ErrorCodes.UserRejection,
      cause,
    });
  }
}
