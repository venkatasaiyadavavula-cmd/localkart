import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | object;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'string' ? exceptionResponse : exceptionResponse;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      this.logger.error(exception);
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const body: Record<string, unknown> = {
      statusCode: status,
      message: typeof message === 'object' && message !== null && 'message' in message
        ? (message as { message: string | string[] }).message
        : message,
    };

    if (!isProduction) {
      body.timestamp = new Date().toISOString();
      body.path = request.url;
    }

    response.status(status).json(body);
  }
}
