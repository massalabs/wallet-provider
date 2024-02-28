type BaseErrorParameters = {
  docsPath?: string;
  metaMessages?: string[];
  cause?: BaseError | Error;
};

export default class BaseError extends Error {
  metaMessages: string[];
  constructor(shortMessage: string, args: BaseErrorParameters = {}) {
    super();

    const metaMessageStr =
      args.metaMessages?.map((msg) => `Meta: ${msg}`).join('\n') || '';
    const docsMessageStr = args.docsPath
      ? `Docs: ${args.docsPath} for more information.`
      : '';

    this.message = [shortMessage, metaMessageStr, docsMessageStr]
      .filter(Boolean) // Remove empty strings
      .join('\n');

    this.name = this.constructor.name;
    this.metaMessages = args.metaMessages || [];
    if (args.cause) this.cause = args.cause;
  }
}
