import { UserRejectionError } from './userRejection';
import { ErrorCodes } from './utils/codes';

test('userRejection', () => {
  const operationName = 'operation';
  const error = new UserRejectionError({
    operationName: operationName,
  });

  expect(error.message).toBe(
    `The operation ${operationName} was rejected by the user.`,
  );
  expect(error.name).toBe('UserRejectionError');
  expect(error.code).toBe(ErrorCodes.UserRejection);
});
