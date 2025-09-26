/**
 * Custom error classes for the knowledge base system
 */

export abstract class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation Errors (400)
export class ValidationError extends BaseError {
  constructor(message: string, field?: string) {
    super(
      field ? `Validation failed for field '${field}': ${message}` : `Validation failed: ${message}`,
      400
    );
  }
}

// Not Found Errors (404)
export class NotFoundError extends BaseError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID '${id}' not found` : `${resource} not found`,
      404
    );
  }
}

// Conflict Errors (409)
export class ConflictError extends BaseError {
  constructor(message: string) {
    super(message, 409);
  }
}

// Unauthorized Errors (401)
export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401);
  }
}

// Forbidden Errors (403)
export class ForbiddenError extends BaseError {
  constructor(message: string = 'Forbidden: Insufficient permissions') {
    super(message, 403);
  }
}

// Bad Request Errors (400)
export class BadRequestError extends BaseError {
  constructor(message: string) {
    super(message, 400);
  }
}

// Internal Server Errors (500)
export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, false);
  }
}

// Database Errors (500)
export class DatabaseError extends BaseError {
  constructor(message: string, operation?: string) {
    super(
      operation ? `Database error during ${operation}: ${message}` : `Database error: ${message}`,
      500,
      false
    );
  }
}

// Business Logic Errors (422)
export class BusinessLogicError extends BaseError {
  constructor(message: string) {
    super(message, 422);
  }
}

// Rate Limit Errors (429)
export class RateLimitError extends BaseError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

// Service Unavailable Errors (503)
export class ServiceUnavailableError extends BaseError {
  constructor(message: string = 'Service temporarily unavailable') {
    super(message, 503, false);
  }
}

/**
 * Error factory for creating specific error types
 */
export class ErrorFactory {
  public static createValidationError(message: string, field?: string): ValidationError {
    return new ValidationError(message, field);
  }

  public static createNotFoundError(resource: string, id?: string): NotFoundError {
    return new NotFoundError(resource, id);
  }

  public static createConflictError(message: string): ConflictError {
    return new ConflictError(message);
  }

  public static createUnauthorizedError(message?: string): UnauthorizedError {
    return new UnauthorizedError(message);
  }

  public static createForbiddenError(message?: string): ForbiddenError {
    return new ForbiddenError(message);
  }

  public static createBadRequestError(message: string): BadRequestError {
    return new BadRequestError(message);
  }

  public static createDatabaseError(message: string, operation?: string): DatabaseError {
    return new DatabaseError(message, operation);
  }

  public static createBusinessLogicError(message: string): BusinessLogicError {
    return new BusinessLogicError(message);
  }
}

/**
 * Error utilities
 */
export class ErrorUtils {
  public static isOperationalError(error: Error): boolean {
    if (error instanceof BaseError) {
      return error.isOperational;
    }
    return false;
  }

  public static getErrorDetails(error: Error): {
    name: string;
    message: string;
    statusCode?: number;
    timestamp?: Date;
    stack?: string;
  } {
    if (error instanceof BaseError) {
      return {
        name: error.name,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: error.timestamp,
        ...(error.stack ? { stack: error.stack } : {})
      };
    }

    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {})
    };
  }

  public static formatErrorForClient(error: Error): {
    success: false;
    error: string;
    message?: string;
    statusCode?: number;
    timestamp?: Date;
  } {
    if (error instanceof BaseError) {
      return {
        success: false,
        error: error.name,
        message: error.message,
        statusCode: error.statusCode,
        timestamp: error.timestamp
      };
    }

    // Handle specific error types
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return {
        success: false,
        error: 'ValidationError',
        message: 'Invalid JSON format',
        statusCode: 400
      };
    }

    // Don't expose internal error details to clients
    return {
      success: false,
      error: 'InternalServerError',
      message: 'An unexpected error occurred',
      statusCode: 500
    };
  }

  public static logError(error: Error, context?: Record<string, unknown>): void {
    const errorDetails = this.getErrorDetails(error);
    
    const logData = {
      ...errorDetails,
      context,
      timestamp: new Date().toISOString()
    };

    if (error instanceof BaseError && error.statusCode >= 500) {
      console.error('Server Error:', JSON.stringify(logData, null, 2));
    } else if (error instanceof BaseError && error.statusCode >= 400) {
      console.warn('Client Error:', JSON.stringify(logData, null, 2));
    } else {
      console.error('Unexpected Error:', JSON.stringify(logData, null, 2));
    }
  }
}
