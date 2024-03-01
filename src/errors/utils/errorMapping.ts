import { UserRejectionError } from '../userRejection';

export function isUserRejectionError(error: Error): boolean {
  const bearbyUserRejectionErrorMessage = 'User rejected';
  const massaUserRejectionErrorMessage = 'Action canceled by user';
  return (
    error.message &&
    (error.message.includes(bearbyUserRejectionErrorMessage) ||
      error.message.includes(massaUserRejectionErrorMessage))
  );
}

export function operationErrorMapping(
  operationName: string,
  error: Error,
): Error {
  if (isUserRejectionError(error)) {
    return new UserRejectionError({
      operationName: operationName,
    });
  } else {
    return error;
  }
}
