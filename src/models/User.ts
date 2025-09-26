import { AbstractBaseEntity } from './abstract/BaseEntity';
import { IUserData, UserRole, Permission } from '../types';

/**
 * User entity with role-based permissions
 * Implements the Strategy pattern for role-based access control
 */
export class User extends AbstractBaseEntity {
  public name: string;
  public email: string;
  public role: UserRole;
  public passwordHash?: string | undefined;

  constructor(
    name: string,
    email: string,
    role: UserRole,
    id?: string,
    passwordHash?: string
  ) {
    super(id);
    this.name = name;
    this.email = email;
    this.role = role;
    this.passwordHash = passwordHash;
  }

  // Update methods
  public updateUser(name?: string, email?: string, role?: UserRole): void {
    if (name !== undefined) {
      this.name = name;
    }
    if (email !== undefined) {
      this.email = email;
    }
    if (role !== undefined) {
      this.role = role;
    }
    this.updateTimestamp();
  }

  // Permission checking methods
  public hasPermission(permission: Permission): boolean {
    switch (this.role) {
      case UserRole.ADMIN:
        return true; // Admin has all permissions
      case UserRole.EDITOR:
        return [Permission.CREATE, Permission.READ, Permission.UPDATE].includes(permission);
      case UserRole.VIEWER:
        return permission === Permission.READ;
      default:
        return false;
    }
  }

  public canCreateTopics(): boolean {
    return this.hasPermission(Permission.CREATE);
  }

  public canEditTopics(): boolean {
    return this.hasPermission(Permission.UPDATE);
  }

  public canDeleteTopics(): boolean {
    return this.hasPermission(Permission.DELETE);
  }

  public canViewTopics(): boolean {
    return this.hasPermission(Permission.READ);
  }

  public canManageUsers(): boolean {
    return this.role === UserRole.ADMIN;
  }

  // Validation
  public validate(): boolean {
    return (
      this.name.trim().length > 0 &&
      this.isValidEmail(this.email) &&
      Object.values(UserRole).includes(this.role)
    );
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Serialization
  public override toJSON(): IUserData {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: this.role,
      createdAt: this.createdAt,
      ...(this.passwordHash && { passwordHash: this.passwordHash })
    };
  }

  public static override fromJSON(data: IUserData): User {
    const user = new User(
      data.name,
      data.email,
      data.role,
      data.id,
      data.passwordHash
    );
    // Note: createdAt is readonly, so we can't modify it directly
    return user;
  }

  // Utility methods
  public getRoleDisplayName(): string {
    switch (this.role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.EDITOR:
        return 'Editor';
      case UserRole.VIEWER:
        return 'Viewer';
      default:
        return 'Unknown';
    }
  }

  public getPermissions(): Permission[] {
    switch (this.role) {
      case UserRole.ADMIN:
        return [Permission.CREATE, Permission.READ, Permission.UPDATE, Permission.DELETE];
      case UserRole.EDITOR:
        return [Permission.CREATE, Permission.READ, Permission.UPDATE];
      case UserRole.VIEWER:
        return [Permission.READ];
      default:
        return [];
    }
  }

  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public isEditor(): boolean {
    return this.role === UserRole.EDITOR;
  }

  public isViewer(): boolean {
    return this.role === UserRole.VIEWER;
  }
}
