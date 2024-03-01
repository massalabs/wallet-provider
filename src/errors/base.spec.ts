import { BaseError } from './base';

test('BaseError', () => {
  expect(new BaseError('An error occurred.').message).toBe(
    `An error occurred.`,
  );

  expect(
    new BaseError('An error occurred.', { details: 'Some details' }).message,
  ).toBe(`An error occurred.

Details: Some details`);

  expect(
    new BaseError('An error occurred.', {
      metaMessages: ['Some meta message'],
    }).message,
  ).toBe(`An error occurred.

Meta: Some meta message`);

  expect(
    new BaseError('An error occurred.', {
      docsPath: 'https://example.com/docs',
    }).message,
  ).toBe(`An error occurred.

Docs: https://example.com/docs for more information.`);
});

test('BaseError with cause', () => {
  const cause = new Error('The cause of the error');
  const baseError = new BaseError('An error occurred.', { cause });
  expect(baseError.cause).toBe(cause);
  expect(baseError.message).toBe(`An error occurred.`);
  if (baseError.cause instanceof Error) {
    expect(baseError.cause.message).toBe(`The cause of the error`);
  }
});
