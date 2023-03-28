import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let error = 'We are unable to process this request';
    let other: Record<string, unknown> = {};

    if (exception?.code == 23503) {
      statusCode = HttpStatus.BAD_REQUEST;
      message = 'This field is being used';
    } else if (exception?.code == 23505) {
      statusCode = HttpStatus.CONFLICT;
      message = `This field ${exception.detail}`;
    } else if (exception?.status == 400) {
      statusCode = HttpStatus.BAD_REQUEST;
      error = 'Bad Request';
      message = exception.response?.message;
      other = { ...exception?.response };
    } else if (exception?.status == 401) {
      statusCode = HttpStatus.UNAUTHORIZED;
      error = 'Unauthorized';
      message = exception.response?.message;
    } else if (exception?.status == 402) {
      statusCode = HttpStatus.PAYMENT_REQUIRED;
      error = exception.response?.message;
      message = exception.response?.message;
    } else if (exception?.status == 403) {
      statusCode = HttpStatus.FORBIDDEN;
      error = 'Forbidden';
      message = exception.response?.message;
    } else if (exception?.status == 404) {
      statusCode = HttpStatus.NOT_FOUND;
      error = 'Not Found';
      message = exception.response?.message;
    } else if (exception?.status == 409) {
      statusCode = HttpStatus.CONFLICT;
      error = 'Conflict';
      message = exception.response?.message;
    }

    const responseBody = {
      statusCode,
      message,
      error,
      ...other,
    };

    response.status(statusCode).json(responseBody);
  }
}
