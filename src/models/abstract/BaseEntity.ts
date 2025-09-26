import { v4 as uuidv4 } from 'uuid';
import { BaseEntity } from '../../types';

/**
 * Abstract base class for all entities in the system
 * Implements common functionality like ID generation and timestamps
 */
export abstract class AbstractBaseEntity implements BaseEntity {
  public readonly id: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  constructor(id?: string) {
    this.id = id || uuidv4();
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Updates the updatedAt timestamp
   */
  protected updateTimestamp(): void {
    this.updatedAt = new Date();
  }

  /**
   * Abstract method to validate entity data
   * Must be implemented by concrete classes
   */
  public abstract validate(): boolean;

  /**
   * Abstract method to convert entity to plain object
   * Must be implemented by concrete classes
   */
  public abstract toJSON(): Record<string, unknown>;

  /**
   * Abstract method to create entity from plain object
   * Must be implemented by concrete classes
   */
  public static fromJSON(_data: Record<string, unknown>): AbstractBaseEntity {
    throw new Error('fromJSON method must be implemented by concrete classes');
  }
}
