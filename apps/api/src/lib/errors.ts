export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'REPO_NOT_FOUND'
  | 'UPSTREAM_ERROR'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: ErrorCode, status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  static validation(message: string, details?: unknown) {
    return new AppError('VALIDATION_ERROR', 400, message, details);
  }

  static notFound(message = 'Resource not found') {
    return new AppError('NOT_FOUND', 404, message);
  }

  static repoNotFound(message = 'GitHub repository not found') {
    return new AppError('REPO_NOT_FOUND', 422, message);
  }

  static upstream(message: string) {
    return new AppError('UPSTREAM_ERROR', 502, message);
  }
}
