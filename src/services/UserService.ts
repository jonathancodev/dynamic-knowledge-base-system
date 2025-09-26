import { DatabaseManager } from '../database/DatabaseManager';
import { User } from '../models/User';
import { PermissionContext } from '../patterns/strategy/PermissionStrategy';
import { ConflictError, UnauthorizedError } from '../utils/errors';
import { 
  IUserData, 
  CreateUserRequest, 
  UserRole,
  Permission,
  QueryOptions 
} from '../types';

/**
 * Service class for managing users and their permissions
 */
export class UserService {
  private dbManager: DatabaseManager;
  private usersDb;

  constructor(dbManager?: DatabaseManager) {
    this.dbManager = dbManager || DatabaseManager.getInstance();
    this.usersDb = this.dbManager.getUsersDatabase();
  }

  /**
   * Registers a new user (public registration)
   */
  public async registerUser(name: string, email: string, password: string, role: UserRole): Promise<User> {
    // Check if email already exists
    const existingUsers = await this.usersDb.findByField('email', email);
    if (existingUsers.length > 0) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password (simplified - in production use bcrypt)
    const passwordHash = this.hashPassword(password);

    // Create user using factory
    const user = new User(name, email, role, undefined, passwordHash);

    if (!user.validate()) {
      throw new Error('Invalid user data');
    }

    // Save to database
    const userData = user.toJSON();
    const savedUser = await this.usersDb.create(userData);
    return User.fromJSON(savedUser);
  }

  /**
   * Logs in a user
   */
  public async loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
    // Find user by email
    const users = await this.usersDb.findByField('email', email);
    if (users.length === 0) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const userData = users[0];
    if (!userData) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    const user = User.fromJSON(userData);

    // Verify password (simplified - in production use bcrypt.compare)
    if (!this.verifyPassword(password, userData.passwordHash || '')) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate token (simplified - in production use JWT)
    const token = this.generateToken(user.id);

    return { user, token };
  }

  /**
   * Creates a new user
   */
  public async createUser(request: CreateUserRequest, creatorId: string): Promise<IUserData> {
    // Check if creator has permission to create users
    const creator = await this.getUserById(creatorId);
    if (!creator || !creator.isAdmin()) {
      throw new Error('Only administrators can create users');
    }

    // Check if email already exists
    const existingUsers = await this.usersDb.findByField('email', request.email);
    if (existingUsers.length > 0) {
      throw new Error('User with this email already exists');
    }

    // Create user directly
    const user = new User(request.name, request.email, request.role);

    if (!user.validate()) {
      throw new Error('Invalid user data');
    }

    // Save to database
    const userData = user.toJSON();
    return await this.usersDb.create(userData);
  }

  /**
   * Gets a user by ID
   */
  public async getUserById(id: string): Promise<User | null> {
    const userData = await this.usersDb.findById(id);
    if (!userData) {
      return null;
    }
    return User.fromJSON(userData);
  }

  /**
   * Gets a user by email
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    const users = await this.usersDb.findByField('email', email);
    if (users.length === 0) {
      return null;
    }
    return User.fromJSON(users[0]!);
  }

  /**
   * Gets all users with optional filtering
   */
  public async getAllUsers(
    requesterId: string,
    options: QueryOptions = {}
  ): Promise<IUserData[]> {
    // Check if requester has permission to view users
    const requester = await this.getUserById(requesterId);
    if (!requester || !requester.isAdmin()) {
      throw new Error('Only administrators can view all users');
    }

    let users = await this.usersDb.find();

    // Apply pagination if specified
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || users.length;
      users = users.slice(offset, offset + limit);
    }

    return users;
  }

  /**
   * Updates a user
   */
  public async updateUser(
    id: string,
    updates: {
      name?: string;
      email?: string;
      role?: UserRole;
    },
    updaterId: string
  ): Promise<IUserData> {
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      throw new Error(`User with ID ${id} not found`);
    }

    const updater = await this.getUserById(updaterId);
    if (!updater) {
      throw new Error('Updater not found');
    }

    // Check permissions
    if (id !== updaterId && !updater.isAdmin()) {
      throw new Error('Only administrators can update other users');
    }

    // If updating role, only admins can do that
    if (updates.role && !updater.isAdmin()) {
      throw new Error('Only administrators can change user roles');
    }

    // Check if email is being changed to an existing email
    if (updates.email && updates.email !== existingUser.email) {
      const existingWithEmail = await this.getUserByEmail(updates.email);
      if (existingWithEmail && existingWithEmail.id !== id) {
        throw new Error('User with this email already exists');
      }
    }

    // Update user
    existingUser.updateUser(updates.name, updates.email, updates.role);

    if (!existingUser.validate()) {
      throw new Error('Invalid user data');
    }

    // Update in database
    const updatedUser = await this.usersDb.update(id, {
      name: existingUser.name,
      email: existingUser.email,
      role: existingUser.role,
    });

    if (!updatedUser) {
      throw new Error('Failed to update user');
    }

    return updatedUser;
  }

  /**
   * Deletes a user
   */
  public async deleteUser(id: string, deleterId: string): Promise<boolean> {
    const userToDelete = await this.getUserById(id);
    if (!userToDelete) {
      return false;
    }

    const deleter = await this.getUserById(deleterId);
    if (!deleter || !deleter.isAdmin()) {
      throw new Error('Only administrators can delete users');
    }

    // Prevent deleting the last admin
    if (userToDelete.isAdmin()) {
      const allUsers = await this.usersDb.find();
      const adminCount = allUsers.filter(u => u.role === UserRole.ADMIN).length;
      if (adminCount <= 1) {
        throw new Error('Cannot delete the last administrator');
      }
    }

    return await this.usersDb.delete(id);
  }

  /**
   * Creates an admin user
   */
  public async createAdmin(
    name: string, 
    email: string, 
    creatorId: string
  ): Promise<IUserData> {
    return await this.createUser({
      name,
      email,
      role: UserRole.ADMIN
    }, creatorId);
  }

  /**
   * Creates an editor user
   */
  public async createEditor(
    name: string, 
    email: string, 
    creatorId: string
  ): Promise<IUserData> {
    return await this.createUser({
      name,
      email,
      role: UserRole.EDITOR
    }, creatorId);
  }

  /**
   * Creates a viewer user
   */
  public async createViewer(
    name: string, 
    email: string, 
    creatorId: string
  ): Promise<IUserData> {
    return await this.createUser({
      name,
      email,
      role: UserRole.VIEWER
    }, creatorId);
  }

  /**
   * Gets users by role
   */
  public async getUsersByRole(
    role: UserRole, 
    requesterId: string
  ): Promise<IUserData[]> {
    const requester = await this.getUserById(requesterId);
    if (!requester || !requester.isAdmin()) {
      throw new Error('Only administrators can filter users by role');
    }

    return await this.usersDb.findByField('role', role);
  }

  /**
   * Checks if a user has a specific permission
   */
  public async checkUserPermission(
    userId: string, 
    permission: Permission
  ): Promise<boolean> {
    const user = await this.getUserById(userId);
    if (!user) {
      return false;
    }

    return user.hasPermission(permission);
  }

  /**
   * Gets a user's permission context
   */
  public async getUserPermissionContext(userId: string): Promise<PermissionContext | null> {
    const user = await this.getUserById(userId);
    if (!user) {
      return null;
    }

    return new PermissionContext(user.role);
  }

  /**
   * Searches users by name or email
   */
  public async searchUsers(
    query: string,
    requesterId: string,
    options: QueryOptions = {}
  ): Promise<IUserData[]> {
    const requester = await this.getUserById(requesterId);
    if (!requester || !requester.isAdmin()) {
      throw new Error('Only administrators can search users');
    }

    const allUsers = await this.usersDb.find();
    const searchTerm = query.toLowerCase();

    let results = allUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );

    // Apply pagination if specified
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || results.length;
      results = results.slice(offset, offset + limit);
    }

    return results;
  }

  /**
   * Changes a user's role
   */
  public async changeUserRole(
    userId: string,
    newRole: UserRole,
    changerId: string
  ): Promise<IUserData> {
    const changer = await this.getUserById(changerId);
    if (!changer || !changer.isAdmin()) {
      throw new Error('Only administrators can change user roles');
    }

    return await this.updateUser(userId, { role: newRole }, changerId);
  }

  /**
   * Gets user statistics
   */
  public async getUserStats(requesterId: string): Promise<{
    totalUsers: number;
    usersByRole: Record<UserRole, number>;
    recentUsers: IUserData[];
    activeRoles: UserRole[];
  }> {
    const requester = await this.getUserById(requesterId);
    if (!requester || !requester.isAdmin()) {
      throw new Error('Only administrators can view user statistics');
    }

    const allUsers = await this.usersDb.find();
    
    // Count by role
    const usersByRole: Record<UserRole, number> = {
      [UserRole.ADMIN]: 0,
      [UserRole.EDITOR]: 0,
      [UserRole.VIEWER]: 0
    };

    for (const user of allUsers) {
      usersByRole[user.role]++;
    }

    // Get recent users (last 10)
    const recentUsers = allUsers
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    // Get active roles (roles that have at least one user)
    const activeRoles = Object.entries(usersByRole)
      .filter(([, count]) => count > 0)
      .map(([role]) => role as UserRole);

    return {
      totalUsers: allUsers.length,
      usersByRole,
      recentUsers,
      activeRoles
    };
  }

  /**
   * Validates user permissions for a specific action
   */
  public async validateUserAction(
    userId: string,
    action: string,
    resourceType: string
  ): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const user = await this.getUserById(userId);
    if (!user) {
      return {
        allowed: false,
        reason: 'User not found'
      };
    }

    const permissionContext = new PermissionContext(user.role);
    const allowed = permissionContext.canPerformAction(action, resourceType);

    return {
      allowed,
      ...(allowed ? {} : { reason: `User role '${user.role}' does not have permission to '${action}' on '${resourceType}'` })
    };
  }

  /**
   * Hashes a password (simplified for demo - use bcrypt in production)
   */
  private hashPassword(password: string): string {
    // In production, use bcrypt.hash(password, saltRounds)
    return Buffer.from(password).toString('base64');
  }

  /**
   * Verifies a password (simplified for demo - use bcrypt in production)
   */
  private verifyPassword(password: string, hash: string): boolean {
    // In production, use bcrypt.compare(password, hash)
    return Buffer.from(password).toString('base64') === hash;
  }

  /**
   * Generates a simple token (simplified for demo - use JWT in production)
   */
  private generateToken(userId: string): string {
    // In production, use JWT with proper signing and expiration
    return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
  }

  /**
   * Gets the default admin user (for system initialization)
   */
  public async getDefaultAdmin(): Promise<User | null> {
    const defaultAdmin = await this.usersDb.findById('admin-default');
    return defaultAdmin ? User.fromJSON(defaultAdmin) : null;
  }

  /**
   * Ensures at least one admin exists in the system
   */
  public async ensureAdminExists(): Promise<void> {
    const allUsers = await this.usersDb.find();
    const adminCount = allUsers.filter(u => u.role === UserRole.ADMIN).length;
    
    if (adminCount === 0) {
      // Create default admin
      const defaultAdmin = new User('Default Admin', 'admin@system.com', UserRole.ADMIN, 'admin-default', this.hashPassword('admin123'));
      await this.usersDb.create(defaultAdmin.toJSON());
    }
  }
}
