import BaseError from './BaseError';

describe('BaseError', () => {
  it('should create a new instance of BaseError', () => {
    const error = new BaseError('Short message', {
      docsPath: 'https://example.com/docs',
      metaMessages: ['Meta message 1', 'Meta message 2'],
      cause: new Error('Cause message'),
    });

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(BaseError);
    expect(error.message).toBe(
      'Short message\nMeta: Meta message 1\nMeta: Meta message 2\nDocs: https://example.com/docs for more information.',
    );
    expect(error.name).toBe('BaseError');
    expect(error.metaMessages).toEqual(['Meta message 1', 'Meta message 2']);
    expect(error.cause).toBeInstanceOf(Error);
  });
});
