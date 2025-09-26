/**
 * Interface for entities that support versioning
 */
export interface IVersionable {
  version: number;
  originalId?: string;
  isCurrentVersion: boolean;

  /**
   * Creates a new version of the entity
   */
  createNewVersion(): IVersionable;

  /**
   * Gets the version number
   */
  getVersion(): number;

  /**
   * Checks if this is the current version
   */
  isCurrentVersionEntity(): boolean;
}

/**
 * Interface for managing versions of entities
 */
export interface IVersionManager<T extends IVersionable> {
  /**
   * Creates a new version of an entity
   */
  createVersion(entity: T): T;

  /**
   * Gets a specific version of an entity
   */
  getVersion(originalId: string, version: number): T | null;

  /**
   * Gets the current version of an entity
   */
  getCurrentVersion(originalId: string): T | null;

  /**
   * Gets all versions of an entity
   */
  getAllVersions(originalId: string): T[];
}
