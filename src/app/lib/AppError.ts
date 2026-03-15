/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  AppError — Typed error hierarchy for NEXA                   ║
 * ║                                                              ║
 * ║  All errors thrown by the service/repository layer extend    ║
 * ║  AppError so the UI can use `instanceof` for safe handling.  ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

/** Base class for all application errors. */
export class AppError extends Error {
  readonly code: string;
  readonly cause?: Error;

  constructor(code: string, message: string, cause?: Error) {
    super(message);
    this.name  = this.constructor.name;
    this.code  = code;
    this.cause = cause;
    // Restore prototype chain after TypeScript transpilation
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** A fetch/XHR-level failure (DNS, CORS, offline, timeout). */
export class NetworkError extends AppError {
  constructor(message = "Network request failed", cause?: Error) {
    super("NETWORK_ERROR", message, cause);
  }
}

/** The API returned 401 or the token could not be refreshed. */
export class AuthError extends AppError {
  constructor(message = "Authentication failed", cause?: Error) {
    super("AUTH_ERROR", message, cause);
  }
}

/** The API returned a non-2xx status with an error body. */
export class ApiError extends AppError {
  readonly statusCode: number;

  constructor(statusCode: number, message: string, cause?: Error) {
    super("API_ERROR", message, cause);
    this.statusCode = statusCode;
  }
}

/** A requested resource does not exist. */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      "NOT_FOUND",
      id ? `${resource} '${id}' not found` : `${resource} not found`,
    );
  }
}

/** An input value failed business-rule validation. */
export class ValidationError extends AppError {
  readonly field?: string;

  constructor(message: string, field?: string) {
    super("VALIDATION_ERROR", message);
    this.field = field;
  }
}

/**
 * Normalizes any thrown value to an AppError.
 * Guarantees the catch block always has a typed error to work with.
 */
export function toAppError(err: unknown): AppError {
  if (err instanceof AppError) return err;
  if (err instanceof Error)    return new AppError("UNKNOWN_ERROR", err.message, err);
  return new AppError("UNKNOWN_ERROR", String(err));
}
