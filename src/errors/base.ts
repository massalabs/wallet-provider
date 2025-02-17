import { ErrorCodes } from './utils/codes';

export type BaseErrorParameters = {
  code?: ErrorCodes;
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

export type BaseErrorType = BaseError & { name: 'WalletProviderError' };

export class BaseError extends Error {
  metaMessages: string[];
  docsPath?: string;
  code: ErrorCodes;

  override name = 'WalletProviderError';
  constructor(
    shortMessage: string,
    args: BaseErrorParameters = { code: ErrorCodes.UnknownError },
  ) {
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
    this.code = args.code ?? ErrorCodes.UnknownError;
    this.cause = args.cause;
  }
}
