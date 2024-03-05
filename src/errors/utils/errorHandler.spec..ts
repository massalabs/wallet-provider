import { UserRejectionError } from '../userRejection';
import { isUserRejectionError, errorHandler } from './errorHandler';

const massaUserRejectionErrorMessage = 'Action canceled by user';
const bearbyUserRejectionErrorMessage = 'User rejected';
const someOtherErrorMessage = 'Some other error';

describe('isUserRejectionError', () => {
  it('should return true if error message includes "User rejected"', () => {
    const error = new Error(massaUserRejectionErrorMessage);
    expect(isUserRejectionError(error)).toBe(true);
  });

  it('should return true if error message includes "Action canceled by user"', () => {
    const error = new Error(bearbyUserRejectionErrorMessage);
    expect(isUserRejectionError(error)).toBe(true);
  });

  it('should return false if error message does not include specific rejection messages', () => {
    const error = new Error(someOtherErrorMessage);
    expect(isUserRejectionError(error)).toBe(false);
  });
});

describe('errorHandler', () => {
  it('should return a UserRejectionError if the error is a user rejection error', () => {
    const error = new Error('User rejected');
    const processedError = errorHandler('someOperation', error);
    expect(processedError).toBeInstanceOf(UserRejectionError);
    expect(processedError.message).toBe(
      'The operation someOperation was rejected by the user.',
    );
  });

  it('should return the original error if the error is not a user rejection error', () => {
    const error = new Error(someOtherErrorMessage);
    const processedError = errorHandler('someOperation', error);
    expect(processedError).toBe(error);
  });
});
