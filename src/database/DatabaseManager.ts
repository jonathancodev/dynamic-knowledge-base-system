import { JsonDatabase } from './JsonDatabase';
import { IDatabaseConfig } from './interfaces/IDatabase';
import { ITopicData, IResourceData, IUserData, ITopicVersion, UserRole } from '../types';

/**
 * Database manager that handles all database instances
 * Implements singleton pattern for centralized database access
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private config: IDatabaseConfig;
  
  // Database instances
  private topicsDb: JsonDatabase<ITopicData>;
  private topicVersionsDb: JsonDatabase<ITopicVersion>;
  private resourcesDb: JsonDatabase<IResourceData>;
  private usersDb: JsonDatabase<IUserData>;

  private constructor(config?: Partial<IDatabaseConfig>) {
    this.config = {
      dataDirectory: './data',
      autoSave: true,
      saveInterval: 5000,
      backupEnabled: false,
      ...config
    };

    // Initialize database instances
    this.topicsDb = new JsonDatabase<ITopicData>('topics', this.config);
    this.topicVersionsDb = new JsonDatabase<ITopicVersion>('topic_versions', this.config);
    this.resourcesDb = new JsonDatabase<IResourceData>('resources', this.config);
    this.usersDb = new JsonDatabase<IUserData>('users', this.config);
  }

  public static getInstance(config?: Partial<IDatabaseConfig>): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }

  // Getter methods for database instances
  public getTopicsDatabase(): JsonDatabase<ITopicData> {
    return this.topicsDb;
  }

  public getTopicVersionsDatabase(): JsonDatabase<ITopicVersion> {
    return this.topicVersionsDb;
  }

  public getResourcesDatabase(): JsonDatabase<IResourceData> {
    return this.resourcesDb;
  }

  public getUsersDatabase(): JsonDatabase<IUserData> {
    return this.usersDb;
  }

  // Utility methods
  public async initializeDatabase(): Promise<void> {
    // Create default admin user if no users exist
    const userCount = await this.usersDb.count();
    if (userCount === 0) {
      await this.createDefaultAdmin();
    }
  }

  private async createDefaultAdmin(): Promise<void> {
    const defaultAdmin: IUserData = {
      id: 'admin-default',
      name: 'Default Admin',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
      createdAt: new Date()
    };

    await this.usersDb.create(defaultAdmin);
  }

  public async backupAll(): Promise<string[]> {
    const backupPaths: string[] = [];
    
    try {
      backupPaths.push(await this.topicsDb.backup());
      backupPaths.push(await this.topicVersionsDb.backup());
      backupPaths.push(await this.resourcesDb.backup());
      backupPaths.push(await this.usersDb.backup());
      
      return backupPaths;
    } catch (error) {
      throw new Error(`Failed to backup databases: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  public async clearAll(): Promise<void> {
    await Promise.all([
      this.topicsDb.clear(),
      this.topicVersionsDb.clear(),
      this.resourcesDb.clear(),
      this.usersDb.clear()
    ]);
  }

  public async closeAll(): Promise<void> {
    await Promise.all([
      this.topicsDb.close(),
      this.topicVersionsDb.close(),
      this.resourcesDb.close(),
      this.usersDb.close()
    ]);
  }

  // Health check methods
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    databases: {
      topics: number;
      topicVersions: number;
      resources: number;
      users: number;
    };
    config: IDatabaseConfig;
  }> {
    try {
      const [topicsCount, versionsCount, resourcesCount, usersCount] = await Promise.all([
        this.topicsDb.count(),
        this.topicVersionsDb.count(),
        this.resourcesDb.count(),
        this.usersDb.count()
      ]);

      return {
        status: 'healthy',
        databases: {
          topics: topicsCount,
          topicVersions: versionsCount,
          resources: resourcesCount,
          users: usersCount
        },
        config: this.config
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        databases: {
          topics: -1,
          topicVersions: -1,
          resources: -1,
          users: -1
        },
        config: this.config
      };
    }
  }

  // Migration methods (for future use)
  public async migrate(): Promise<void> {
    // Placeholder for database migrations
    // This would contain logic to update database schema or data structure
    console.log('Database migration completed');
  }

  public getConfig(): IDatabaseConfig {
    return { ...this.config };
  }

  // Reset singleton instance (for testing)
  public static resetInstance(): void {
    DatabaseManager.instance = null as unknown as DatabaseManager;
  }
}
