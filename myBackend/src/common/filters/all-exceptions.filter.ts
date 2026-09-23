import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * A single place that turns *any* thrown error into a consistent JSON
 * response shape. Without this, unexpected errors (e.g. a bug, a network
 * failure while talking to the data platform) leak raw stack traces / Nest's
 * default HTML error page to the client, and the shape of error responses is
 * inconsistent between hand-thrown HttpExceptions and uncaught errors.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const payload = isHttpException ? exception.getResponse() : null;
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? (payload as { message: string | string[] }).message
        : isHttpException
          ? exception.message
          : 'Internal server error';

    if (!isHttpException) {
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
