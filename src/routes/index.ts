import { Router } from 'express';
import topicRoutes from './topicRoutes';
import resourceRoutes from './resourceRoutes';
import userRoutes from './userRoutes';
import { DatabaseManager } from '../database/DatabaseManager';
import { ApiResponse } from '../types';

const router = Router();

// Mount route modules
router.use('/topics', topicRoutes);
router.use('/resources', resourceRoutes);
router.use('/users', userRoutes);

// Health check endpoint
router.get('/health', async (_req, res) => {
  try {
    const dbManager = DatabaseManager.getInstance();
    const healthCheck = await dbManager.healthCheck();
    
    const response: ApiResponse = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        database: healthCheck
      },
      message: 'Service is healthy'
    };

    res.json(response);
  } catch (error) {
    const response: ApiResponse = {
      success: false,
      error: 'HealthCheckFailed',
      message: 'Service health check failed'
    };

    res.status(503).json(response);
  }
});

// API information endpoint
router.get('/info', (_req, res) => {
  const response: ApiResponse = {
    success: true,
    data: {
      name: 'Dynamic Knowledge Base System API',
      version: '1.0.0',
      description: 'A RESTful API for managing interconnected topics and resources with version control, user roles, and permissions',
      features: [
        'Topic management with version control',
        'Hierarchical topic structure',
        'Resource management',
        'User role-based permissions',
        'Shortest path algorithm between topics',
        'Recursive topic retrieval',
        'Search functionality',
        'Comprehensive error handling'
      ],
      endpoints: {
        topics: '/api/topics',
        resources: '/api/resources',
        users: '/api/users',
        health: '/api/health',
        info: '/api/info'
      }
    },
    message: 'API information retrieved successfully'
  };

  res.json(response);
});

export default router;
