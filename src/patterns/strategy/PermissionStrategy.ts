import { UserRole, Permission } from '../../types';

/**
 * Strategy pattern implementation for user permissions
 * Different strategies for different user roles
 */
export interface IPermissionStrategy {
  /**
   * Checks if the user has a specific permission
   */
  hasPermission(permission: Permission): boolean;

  /**
   * Gets all permissions for this role
   */
  getPermissions(): Permission[];

  /**
   * Gets the role name
   */
  getRoleName(): string;

  /**
   * Checks if the user can perform a specific action on a resource
   */
  canPerformAction(action: string, resourceType: string): boolean;
}

/**
 * Admin permission strategy - has all permissions
 */
export class AdminPermissionStrategy implements IPermissionStrategy {
  public hasPermission(_permission: Permission): boolean {
    return true; // Admin has all permissions
  }

  public getPermissions(): Permission[] {
    return [Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.DELETE];
  }

  public getRoleName(): string {
    return UserRole.ADMIN;
  }

  public canPerformAction(_action: string, _resourceType: string): boolean {
    return true; // Admin can perform any action on any resource
  }
}

/**
 * Editor permission strategy - can create, read, and update
 */
export class EditorPermissionStrategy implements IPermissionStrategy {
  public hasPermission(permission: Permission): boolean {
    return [Permission.CREATE, Permission.READ, Permission.UPDATE].includes(permission);
  }

  public getPermissions(): Permission[] {
    return [Permission.CREATE, Permission.READ, Permission.UPDATE];
  }

  public getRoleName(): string {
    return UserRole.EDITOR;
  }

  public canPerformAction(action: string, _resourceType: string): boolean {
    const allowedActions = ['create', 'read', 'update', 'list', 'search'];
    return allowedActions.includes(action.toLowerCase());
  }
}

/**
 * Viewer permission strategy - can only read
 */
export class ViewerPermissionStrategy implements IPermissionStrategy {
  public hasPermission(permission: Permission): boolean {
    return permission === Permission.READ;
  }

  public getPermissions(): Permission[] {
    return [Permission.READ];
  }

  public getRoleName(): string {
    return UserRole.VIEWER;
  }

  public canPerformAction(action: string, _resourceType: string): boolean {
    const allowedActions = ['read', 'list', 'search', 'view'];
    return allowedActions.includes(action.toLowerCase());
  }
}

/**
 * Permission context that uses different strategies based on user role
 */
export class PermissionContext {
  private strategy!: IPermissionStrategy;

  constructor(role: UserRole) {
    this.setStrategy(role);
  }

  public setStrategy(role: UserRole): void {
    switch (role) {
      case UserRole.ADMIN:
        this.strategy = new AdminPermissionStrategy();
        break;
      case UserRole.EDITOR:
        this.strategy = new EditorPermissionStrategy();
        break;
      case UserRole.VIEWER:
        this.strategy = new ViewerPermissionStrategy();
        break;
      default:
        throw new Error(`Unknown user role: ${role}`);
    }
  }

  public hasPermission(permission: Permission): boolean {
    return this.strategy.hasPermission(permission);
  }

  public getPermissions(): Permission[] {
    return this.strategy.getPermissions();
  }

  public getRoleName(): string {
    return this.strategy.getRoleName();
  }

  public canPerformAction(action: string, resourceType: string): boolean {
    return this.strategy.canPerformAction(action, resourceType);
  }

  public canCreateTopic(): boolean {
    return this.hasPermission(Permission.CREATE);
  }

  public canUpdateTopic(): boolean {
    return this.hasPermission(Permission.UPDATE);
  }

  public canDeleteTopic(): boolean {
    return this.hasPermission(Permission.DELETE);
  }

  public canViewTopic(): boolean {
    return this.hasPermission(Permission.READ);
  }

  public canCreateResource(): boolean {
    return this.hasPermission(Permission.CREATE);
  }

  public canUpdateResource(): boolean {
    return this.hasPermission(Permission.UPDATE);
  }

  public canDeleteResource(): boolean {
    return this.hasPermission(Permission.DELETE);
  }

  public canManageUsers(): boolean {
    return this.strategy instanceof AdminPermissionStrategy;
  }

  public canAccessAdminFeatures(): boolean {
    return this.strategy instanceof AdminPermissionStrategy;
  }

  public canModifyTopicHierarchy(): boolean {
    return this.hasPermission(Permission.UPDATE) || this.hasPermission(Permission.CREATE);
  }

  public canViewTopicVersions(): boolean {
    return this.hasPermission(Permission.READ);
  }

  public canCreateTopicVersions(): boolean {
    return this.hasPermission(Permission.UPDATE);
  }
}

/**
 * Factory for creating permission contexts
 */
export class PermissionContextFactory {
  private static contexts: Map<UserRole, PermissionContext> = new Map();

  public static getContext(role: UserRole): PermissionContext {
    if (!this.contexts.has(role)) {
      this.contexts.set(role, new PermissionContext(role));
    }
    return this.contexts.get(role)!;
  }

  public static createContext(role: UserRole): PermissionContext {
    return new PermissionContext(role);
  }

  public static clearCache(): void {
    this.contexts.clear();
  }
}
