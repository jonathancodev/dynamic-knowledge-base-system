import { Request, Response, NextFunction } from 'express';
import { BaseError, ErrorUtils } from '../utils/errors';
import { ApiResponse } from '../types';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  ErrorUtils.logError(error, {
    method: req.method,
    url: req.url,
    body: req.body,
    params: req.params,
    query: req.query,
    userId: (req as any).userId || 'anonymous'
  });

  // Format error response for client
  const errorResponse = ErrorUtils.formatErrorForClient(error);
  
  // Set status code
  let statusCode = 500;
  if (error instanceof BaseError) {
    statusCode = error.statusCode;
  } else if (error instanceof SyntaxError && error.message.includes('JSON')) {
    statusCode = 400; // Bad Request for invalid JSON
  }
  
  // Send error response
  const response: ApiResponse = {
    success: false,
    error: errorResponse.error,
    ...(errorResponse.message && { message: errorResponse.message })
  };

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler for unmatched routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const response: ApiResponse = {
    success: false,
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`
  };

  res.status(404).json(response);
};

/**
 * Async error wrapper to catch async errors in route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation error handler middleware
 */
export const validationErrorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.name === 'ValidationError') {
    const response: ApiResponse = {
      success: false,
      error: 'ValidationError',
      message: error.message
    };

    res.status(400).json(response);
    return;
  }

  next(error);
};

/**
 * Database error handler middleware
 */
export const databaseErrorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle specific database errors
  if (error.message.includes('ENOENT') || error.message.includes('file not found')) {
    const response: ApiResponse = {
      success: false,
      error: 'DatabaseError',
      message: 'Database file not accessible'
    };

    res.status(500).json(response);
    return;
  }

  if (error.message.includes('JSON.parse')) {
    const response: ApiResponse = {
      success: false,
      error: 'DatabaseError',
      message: 'Database file corrupted'
    };

    res.status(500).json(response);
    return;
  }

  next(error);
};

/**
 * Rate limiting error handler
 */
export const rateLimitErrorHandler = (
  _req: Request,
  res: Response
): void => {
  const response: ApiResponse = {
    success: false,
    error: 'RateLimitExceeded',
    message: 'Too many requests, please try again later'
  };

  res.status(429).json(response);
};

/**
 * CORS error handler
 */
export const corsErrorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error.message.includes('CORS')) {
    const response: ApiResponse = {
      success: false,
      error: 'CORSError',
      message: 'Cross-origin request blocked'
    };

    res.status(403).json(response);
    return;
  }

  next(error);
};

/**
 * Unhandled promise rejection handler
 */
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: Error | any, promise: Promise<any>) => {
    console.error('Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
    
    // Log the error
    ErrorUtils.logError(
      reason instanceof Error ? reason : new Error(String(reason)),
      { type: 'UnhandledPromiseRejection' }
    );
  });
};

/**
 * Uncaught exception handler
 */
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    console.error('Uncaught Exception:', error);
    
    // Log the error
    ErrorUtils.logError(error, { type: 'UncaughtException' });
    
    // Gracefully shutdown the process
    process.exit(1);
  });
};

/**
 * Graceful shutdown handler
 */
export const handleGracefulShutdown = (server: any): void => {
  const gracefulShutdown = (signal: string): void => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close((err: Error | undefined) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      
      console.log('Server shut down gracefully');
      process.exit(0);
    });
    
    // Force shutdown after 30 seconds
    setTimeout(() => {
      console.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

/**
 * Error boundary for critical operations
 */
export class ErrorBoundary {
  public static async execute<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      ErrorUtils.logError(
        error instanceof Error ? error : new Error(String(error)),
        { operation: context }
      );
      throw error;
    }
  }

  public static executeSync<T>(
    operation: () => T,
    context: string
  ): T {
    try {
      return operation();
    } catch (error) {
      ErrorUtils.logError(
        error instanceof Error ? error : new Error(String(error)),
        { operation: context }
      );
      throw error;
    }
  }
}
