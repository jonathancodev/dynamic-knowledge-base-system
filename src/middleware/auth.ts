import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { PermissionContext } from '../patterns/strategy/PermissionStrategy';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { Permission, UserRole } from '../types';

// Extend Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
      permissionContext?: PermissionContext;
    }
  }
}

/**
 * Authentication middleware
 * For this demo, we'll use a simple header-based authentication
 * In a real application, you would use JWT tokens or session-based auth
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get user ID from header (in a real app, this would be from JWT token)
    const userId = req.headers['x-user-id'] as string;
    
    if (!userId) {
      throw new UnauthorizedError('User ID header is required');
    }

    // Validate user exists
    const userService = new UserService();
    const user = await userService.getUserById(userId);
    
    if (!user) {
      throw new UnauthorizedError('Invalid user ID');
    }

    // Add user information to request
    req.userId = user.id;
    req.userRole = user.role;
    req.permissionContext = new PermissionContext(user.role);

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication middleware
 * Adds user info if present but doesn't require it
 */
export const optionalAuthenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    if (userId) {
      const userService = new UserService();
      const user = await userService.getUserById(userId);
      
      if (user) {
        req.userId = user.id;
        req.userRole = user.role;
        req.permissionContext = new PermissionContext(user.role);
      }
    }

    next();
  } catch (error) {
    // Don't fail on optional auth errors, just continue without user info
    next();
  }
};

/**
 * Authorization middleware factory
 * Creates middleware that checks for specific permissions
 */
export const authorize = (permission: Permission) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.permissionContext) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!req.permissionContext.hasPermission(permission)) {
        throw new ForbiddenError(`Permission '${permission}' required`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Role-based authorization middleware factory
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userRole) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!allowedRoles.includes(req.userRole)) {
        throw new ForbiddenError(`Role must be one of: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Editor or Admin middleware
 */
export const requireEditorOrAdmin = requireRole([UserRole.EDITOR, UserRole.ADMIN]);

/**
 * Custom authorization middleware factory
 * Allows for complex authorization logic
 */
export const customAuthorize = (
  authorizeFn: (req: Request) => boolean | Promise<boolean>,
  errorMessage?: string
) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const isAuthorized = await authorizeFn(req);
      
      if (!isAuthorized) {
        throw new ForbiddenError(errorMessage || 'Access denied');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Resource ownership middleware
 * Checks if the user owns the resource or is an admin
 */
export const requireOwnershipOrAdmin = (resourceUserIdField: string = 'userId') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userId) {
        throw new UnauthorizedError('Authentication required');
      }

      // Admins can access any resource
      if (req.userRole === UserRole.ADMIN) {
        next();
        return;
      }

      // Check if user owns the resource
      const resourceUserId = req.body[resourceUserIdField] || 
                           req.params[resourceUserIdField] || 
                           req.query[resourceUserIdField];

      if (resourceUserId !== req.userId) {
        throw new ForbiddenError('Access denied: You can only access your own resources');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Action-based authorization middleware
 * Checks if user can perform a specific action on a resource type
 */
export const authorizeAction = (action: string, resourceType: string) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.permissionContext) {
        throw new UnauthorizedError('Authentication required');
      }

      if (!req.permissionContext.canPerformAction(action, resourceType)) {
        throw new ForbiddenError(
          `Permission denied: Cannot '${action}' on '${resourceType}'`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user can create topics
 */
export const canCreateTopics = authorize(Permission.CREATE);

/**
 * Middleware to check if user can update topics
 */
export const canUpdateTopics = authorize(Permission.UPDATE);

/**
 * Middleware to check if user can delete topics
 */
export const canDeleteTopics = authorize(Permission.DELETE);

/**
 * Middleware to check if user can view topics
 */
export const canViewTopics = authorize(Permission.READ);

/**
 * Middleware to validate user permissions for topic hierarchy operations
 */
export const canModifyTopicHierarchy = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (!req.permissionContext) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!req.permissionContext.canModifyTopicHierarchy()) {
      throw new ForbiddenError('Permission denied: Cannot modify topic hierarchy');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to check if user can manage other users
 */
export const canManageUsers = (req: Request, _res: Response, next: NextFunction): void => {
  try {
    if (!req.permissionContext) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!req.permissionContext.canManageUsers()) {
      throw new ForbiddenError('Permission denied: Cannot manage users');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limiting by user role
 */
export const roleBasedRateLimit = () => {
  const rateLimits = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.userId || !req.userRole) {
        next();
        return;
      }

      const now = Date.now();
      const windowMs = 60 * 1000; // 1 minute window
      
      // Different limits based on role
      const limits = {
        [UserRole.ADMIN]: 1000,
        [UserRole.EDITOR]: 500,
        [UserRole.VIEWER]: 100
      };

      const limit = limits[req.userRole];
      const key = `${req.userId}-${Math.floor(now / windowMs)}`;
      
      const userLimit = rateLimits.get(key) || { count: 0, resetTime: now + windowMs };
      
      if (userLimit.count >= limit) {
        throw new ForbiddenError('Rate limit exceeded for your user role');
      }

      userLimit.count++;
      rateLimits.set(key, userLimit);

      // Clean up old entries
      for (const [k, v] of rateLimits.entries()) {
        if (v.resetTime < now) {
          rateLimits.delete(k);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
