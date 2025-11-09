import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class AppException extends Error {
  private readonly code: number;
  private readonly statusCode: ContentfulStatusCode;
  private readonly data: object | null;
  private readonly msg: string;

  constructor(
    code: number,
    statusCode: ContentfulStatusCode,
    data: object | null,
    msg: string = '',
  ) {
    super();
    this.code = code;
    this.statusCode = statusCode;
    this.data = data;
    this.msg = msg;
  }

  getStatusCode() {
    return this.statusCode;
  }

  getCode() {
    return this.code;
  }

  getMsg() {
    return this.msg;
  }

  getData() {
    return this.data;
  }
}

export class BadRequestException extends AppException {
  constructor(msg: string = 'Request is invalid') {
    super(400, 400, null, msg);
  }
}

export class NotFoundException extends AppException {
  constructor(msg: string = 'Resource not found') {
    super(404, 404, null, msg);
  }
}

export class UnprocessableContentException extends AppException {
  constructor(msg: string = 'Request is unprocessable') {
    super(422, 422, null, msg);
  }
}

export class TooManyRequestsException extends AppException {
  constructor(msg: string = 'Request rate limit exceeded') {
    super(429, 429, null, msg);
  }
}

export class InternalServerErrorException extends AppException {
  constructor(msg: string = 'Internal server error') {
    super(500, 500, null, msg);
  }
}
