type BaseErrorParameters = {
  docsPath?: string;
  metaMessages?: string[];
} & (
  | {
      cause?: never;
      details?: string;
    }
  | {
      cause: BaseError | Error;
      details?: never;
    }
);

export default class BaseError extends Error {
  metaMessages: string[];
  docsPath?: string;
  override name = 'WalletProviderError';
  constructor(shortMessage: string, args: BaseErrorParameters = {}) {
    super();

    const metaMessageStr =
      args.metaMessages?.map((msg) => `Meta: ${msg}`).join('\n') || '';
    const docsMessageStr = args.docsPath
      ? `Docs: ${args.docsPath} for more information.`
      : '';

    const detailsMessage = args.details ? `Details: ${args.details}` : '';

    this.message = [
      shortMessage,
      metaMessageStr,
      docsMessageStr,
      detailsMessage,
    ]
      .filter(Boolean)
      .join('\n\n');

    this.metaMessages = args.metaMessages || [];
    this.docsPath = args.docsPath;
    this.cause = args.cause;
  }
}
