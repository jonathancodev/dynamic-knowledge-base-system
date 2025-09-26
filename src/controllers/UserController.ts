import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/UserService';
import { Validator } from '../utils/validation';
import { NotFoundError } from '../utils/errors';
import { ApiResponse, IUserData, UserRole } from '../types';

/**
 * Controller for user-related operations
 */
export class UserController {
  private readonly userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Registers a new user (public endpoint)
   */
  public registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = Validator.validateUserRegister(req.body);
      
      const user = await this.userService.registerUser(
        validatedData.name,
        validatedData.email,
        validatedData.password,
        validatedData.role ?? UserRole.VIEWER
      );
      
      const response: ApiResponse<IUserData> = {
        success: true,
        data: user.toJSON(),
        message: 'User registered successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logs in a user (public endpoint)
   */
  public loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedData = Validator.validateUserLogin(req.body);
      
      const result = await this.userService.loginUser(validatedData.email, validatedData.password);
      
      const response: ApiResponse = {
        success: true,
        data: {
          user: result.user.toJSON(),
          token: result.token
        },
        message: 'Login successful'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates a new user
   */
  public createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const creatorId = req.userId!;
      const validatedData = Validator.validateUserCreate(req.body);
      
      const user = await this.userService.createUser(validatedData, creatorId);
      
      const response: ApiResponse<IUserData> = {
        success: true,
        data: user,
        message: 'User created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets a user by ID
   */
  public getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Validator.validateId(req.params.id!, 'User ID');
      
      const user = await this.userService.getUserById(userId);
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      const response: ApiResponse<IUserData> = {
        success: true,
        data: user.toJSON(),
        message: 'User retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets all users (admin only)
   */
  public getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.userId!;
      const paginationOptions = Validator.validatePagination(req.query);
      
      const users = await this.userService.getAllUsers(requesterId, paginationOptions);
      
      const response: ApiResponse<IUserData[]> = {
        success: true,
        data: users,
        message: 'Users retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates a user
   */
  public updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Validator.validateId(req.params.id!, 'User ID');
      const updaterId = req.userId!;
      const validatedData = Validator.validateUserUpdate(req.body);
      
      const updatedUser = await this.userService.updateUser(userId, validatedData, updaterId);
      
      const response: ApiResponse<IUserData> = {
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletes a user
   */
  public deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Validator.validateId(req.params.id!, 'User ID');
      const deleterId = req.userId!;
      
      const deleted = await this.userService.deleteUser(userId, deleterId);
      
      if (!deleted) {
        throw new NotFoundError('User', userId);
      }

      const response: ApiResponse = {
        success: true,
        message: 'User deleted successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates an admin user
   */
  public createAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const creatorId = req.userId!;
      const { name, email } = req.body;
      
      if (!name || !email) {
        throw new Error('Name and email are required');
      }
      
      const admin = await this.userService.createAdmin(name, email, creatorId);
      
      const response: ApiResponse<IUserData> = {
        success: true,
        data: admin,
        message: 'Admin user created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates an editor user
   */
  public createEditor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const creatorId = req.userId!;
      const { name, email } = req.body;
      
      if (!name || !email) {
        throw new Error('Name and email are required');
      }
      
      const editor = await this.userService.createEditor(name, email, creatorId);
      
      const response: ApiResponse<IUserData> = {
        success: true,
        data: editor,
        message: 'Editor user created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates a viewer user
   */
  public createViewer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const creatorId = req.userId!;
      const { name, email } = req.body;
      
      if (!name || !email) {
        throw new Error('Name and email are required');
      }
      
      const viewer = await this.userService.createViewer(name, email, creatorId);
      
      const response: ApiResponse<IUserData> = {
        success: true,
        data: viewer,
        message: 'Viewer user created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets users by role
   */
  public getUsersByRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.userId!;
      const role = req.params.role as UserRole;
      
      // Validate role
      if (!Object.values(UserRole).includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }
      
      const users = await this.userService.getUsersByRole(role, requesterId);
      
      const response: ApiResponse<IUserData[]> = {
        success: true,
        data: users,
        message: `Users with role '${role}' retrieved successfully`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Searches users by name or email
   */
  public searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.userId!;
      const { q: query } = Validator.validateSearch(req.query);
      const paginationOptions = Validator.validatePagination(req.query);
      
      const users = await this.userService.searchUsers(query, requesterId, paginationOptions);
      
      const response: ApiResponse<IUserData[]> = {
        success: true,
        data: users,
        message: `Found ${users.length} users matching "${query}"`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Changes a user's role
   */
  public changeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Validator.validateId(req.params.id!, 'User ID');
      const changerId = req.userId!;
      const { role } = req.body;
      
      // Validate role
      if (!Object.values(UserRole).includes(role)) {
        throw new Error(`Invalid role: ${role}`);
      }
      
      const updatedUser = await this.userService.changeUserRole(userId, role, changerId);
      
      const response: ApiResponse<IUserData> = {
        success: true,
        data: updatedUser,
        message: `User role changed to '${role}' successfully`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets user statistics
   */
  public getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const requesterId = req.userId!;
      
      const stats = await this.userService.getUserStats(requesterId);
      
      const response: ApiResponse = {
        success: true,
        data: stats,
        message: 'User statistics retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validates user permissions for a specific action
   */
  public validateUserAction = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Validator.validateId(req.params.id!, 'User ID');
      const { action, resourceType } = req.body;
      
      if (!action || !resourceType) {
        throw new Error('Action and resourceType are required');
      }
      
      const validation = await this.userService.validateUserAction(userId, action, resourceType);
      
      const response: ApiResponse = {
        success: true,
        data: validation,
        message: 'User action validation completed'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets the current user's profile
   */
  public getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      
      const user = await this.userService.getUserById(userId);
      
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      const response: ApiResponse<IUserData> = {
        success: true,
        data: user.toJSON(),
        message: 'Current user profile retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates the current user's profile
   */
  public updateCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      
      // Only allow updating name and email, not role
      const { name, email } = req.body;
      const updates: { name?: string; email?: string } = {};
      
      if (name) updates.name = name;
      if (email) updates.email = email;
      
      if (Object.keys(updates).length === 0) {
        throw new Error('At least one field (name or email) must be provided');
      }
      
      const updatedUser = await this.userService.updateUser(userId, updates, userId);
      
      const response: ApiResponse<IUserData> = {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets user permissions
   */
  public getUserPermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = Validator.validateId(req.params.id!, 'User ID');
      
      const permissionContext = await this.userService.getUserPermissionContext(userId);
      
      if (!permissionContext) {
        throw new NotFoundError('User', userId);
      }

      const response: ApiResponse = {
        success: true,
        data: {
          role: permissionContext.getRoleName(),
          permissions: permissionContext.getPermissions(),
          canCreateTopics: permissionContext.canCreateTopic(),
          canUpdateTopics: permissionContext.canUpdateTopic(),
          canDeleteTopics: permissionContext.canDeleteTopic(),
          canViewTopics: permissionContext.canViewTopic(),
          canManageUsers: permissionContext.canManageUsers(),
          canAccessAdminFeatures: permissionContext.canAccessAdminFeatures()
        },
        message: 'User permissions retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
