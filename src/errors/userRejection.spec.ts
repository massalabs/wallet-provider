import { UserRejectionError } from './userRejection';

test('userRejection', () => {
  const operationName = 'operation';
  const error = new UserRejectionError({
    operationName: operationName,
  });
  expect(error.message).toBe(
    `The operation ${operationName} was rejected by the user.`,
  );

  expect(error.name).toBe('UserRejectionError');
});
