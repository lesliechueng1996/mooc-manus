import { getLogger } from '@repo/common';

export class Logger {
  private logger = getLogger();
  private requestId: string;
  private userId: string;

  constructor(requestId: string = 'N/A', userId: string = 'N/A') {
    this.requestId = requestId;
    this.userId = userId;
  }

  public setRequestId(value: string) {
    this.requestId = value;
  }

  public setUserId(value: string) {
    this.userId = value;
  }

  public info(message: string, data: Record<string, unknown> = {}) {
    this.logger.info(
      `Request ID: {requestId} - User ID: {userId} - ${message}`,
      { ...data, requestId: this.requestId, userId: this.userId },
    );
  }

  public error(message: string, data: Record<string, unknown> = {}) {
    let formattedMessage = `Request ID: {requestId} - User ID: {userId} - ${message}`;
    if ('error' in data) {
      formattedMessage += `\nError: {error}`;
    }
    this.logger.error(formattedMessage, {
      ...data,
      requestId: this.requestId,
      userId: this.userId,
    });
  }
}
