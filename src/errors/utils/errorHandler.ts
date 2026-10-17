import { UserRejectionError } from '../userRejection';

// EIP-1193's "user rejected the request", used by RustCore Wallet
const userRejectedRequestCode = 4001;

export function isUserRejectionError(error: Error): boolean {
  const bearbyUserRejectionErrorMessage = 'User rejected';
  const massaUserRejectionErrorMessage = 'Action canceled by user';
  if ((error as { code?: unknown })?.code === userRejectedRequestCode) {
    return true;
  }
  return (
    !!error?.message &&
    (error.message.includes(bearbyUserRejectionErrorMessage) ||
      error.message.includes(massaUserRejectionErrorMessage))
  );
}

export function errorHandler(operationName: string, error: Error): Error {
  if (isUserRejectionError(error)) {
    return new UserRejectionError({
      operationName: operationName,
      cause: error,
    });
  }

  return error;
}
