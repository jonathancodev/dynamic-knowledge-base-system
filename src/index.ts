import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import routes from './routes';
import { DatabaseManager } from './database/DatabaseManager';
import {
  errorHandler,
  notFoundHandler,
  validationErrorHandler,
  databaseErrorHandler,
  corsErrorHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  handleGracefulShutdown,
  rateLimitErrorHandler
} from './middleware';

/**
 * Main Express application for the Dynamic Knowledge Base System
 */
class App {
  public app: express.Application;
  private server: any;
  private dbManager: DatabaseManager;

  constructor() {
    this.app = express();
    this.dbManager = DatabaseManager.getInstance();
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.setupProcessHandlers();
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id'],
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Limit each IP
      message: 'Too many requests from this IP, please try again later',
      standardHeaders: true,
      legacyHeaders: false,
      handler: rateLimitErrorHandler,
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware (simple version)
    this.app.use((req, _res, next) => {
      const timestamp = new Date().toISOString();
      const method = req.method;
      const url = req.url;
      const userAgent = req.get('User-Agent') || 'Unknown';
      const userId = req.headers['x-user-id'] || 'anonymous';
      
      console.log(`[${timestamp}] ${method} ${url} - User: ${userId} - UA: ${userAgent}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api', routes);

    // Root endpoint
    this.app.get('/', (_req, res) => {
      res.json({
        success: true,
        message: 'Welcome to the Dynamic Knowledge Base System API',
        version: '1.0.0',
        documentation: '/api/info',
        health: '/api/health'
      });
    });
  }

  private initializeErrorHandling(): void {
    // Specific error handlers (order matters)
    this.app.use(corsErrorHandler);
    this.app.use(validationErrorHandler);
    this.app.use(databaseErrorHandler);
    
    // 404 handler for unmatched routes
    this.app.use(notFoundHandler);
    
    // Global error handler (must be last)
    this.app.use(errorHandler);
  }

  private setupProcessHandlers(): void {
    // Handle unhandled promise rejections and uncaught exceptions
    handleUnhandledRejection();
    handleUncaughtException();
  }

  public async start(): Promise<void> {
    try {
      // Initialize database
      await this.dbManager.initializeDatabase();
      console.log('Database initialized successfully');

      // Start server
      const port = process.env.PORT || 3000;
      this.server = this.app.listen(port, () => {
        console.log(`Dynamic Knowledge Base System API is running on port ${port}`);
        console.log(`API Documentation: http://localhost:${port}/api/info`);
        console.log(`Health Check: http://localhost:${port}/api/health`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Setup graceful shutdown
      handleGracefulShutdown(this.server);

    } catch (error) {
      console.error('Failed to start the application:', error);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    try {
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server.close(() => {
            console.log('Server stopped');
            resolve();
          });
        });
      }

      // Close database connections
      await this.dbManager.closeAll();
      console.log('Database connections closed');

    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }

  public getApp(): express.Application {
    return this.app;
  }
}

// Create and start the application
const app = new App();

// Start the server if this file is run directly
if (require.main === module) {
  app.start().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}

export default app;
