/**
 * Generic database interface for CRUD operations
 */
export interface IDatabase<T> {
  /**
   * Creates a new record
   */
  create(data: T): Promise<T>;

  /**
   * Finds a record by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Finds records matching criteria
   */
  find(criteria?: Partial<T>): Promise<T[]>;

  /**
   * Updates a record by ID
   */
  update(id: string, data: Partial<T>): Promise<T | null>;

  /**
   * Deletes a record by ID
   */
  delete(id: string): Promise<boolean>;

  /**
   * Checks if a record exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Gets the total count of records
   */
  count(criteria?: Partial<T>): Promise<number>;

  /**
   * Clears all records (for testing purposes)
   */
  clear(): Promise<void>;
}

/**
 * Database configuration interface
 */
export interface IDatabaseConfig {
  dataDirectory: string;
  autoSave: boolean;
  saveInterval?: number;
  backupEnabled?: boolean;
  backupInterval?: number;
}

/**
 * Database transaction interface
 */
export interface ITransaction {
  /**
   * Commits the transaction
   */
  commit(): Promise<void>;

  /**
   * Rolls back the transaction
   */
  rollback(): Promise<void>;

  /**
   * Checks if transaction is active
   */
  isActive(): boolean;
}
