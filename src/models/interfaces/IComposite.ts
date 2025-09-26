/**
 * Interface for implementing the Composite pattern
 * Used for hierarchical structures like topics with subtopics
 */
export interface IComposite<T> {
  /**
   * Adds a child component
   */
  add(component: T): void;

  /**
   * Removes a child component
   */
  remove(component: T): void;

  /**
   * Gets a child component by ID
   */
  getChild(id: string): T | null;

  /**
   * Gets all child components
   */
  getChildren(): T[];

  /**
   * Checks if the component has children
   */
  hasChildren(): boolean;

  /**
   * Gets the parent component
   */
  getParent(): T | null;

  /**
   * Sets the parent component
   */
  setParent(parent: T | null): void;

  /**
   * Performs an operation on this component and all its children
   */
  operation(): void;
}

/**
 * Interface for components that can be part of a composite structure
 */
export interface IComponent<T> {
  /**
   * Gets the unique identifier
   */
  getId(): string;

  /**
   * Gets the parent component
   */
  getParent(): T | null;

  /**
   * Sets the parent component
   */
  setParent(parent: T | null): void;

  /**
   * Performs the component's operation
   */
  operation(): void;
}
