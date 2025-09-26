import { AbstractBaseEntity } from './abstract/BaseEntity';
import { IVersionable } from './interfaces/IVersionable';
import { IComposite, IComponent } from './interfaces/IComposite';
import { ITopicData, IResourceData } from '../types';

/**
 * Topic entity implementing versioning and composite pattern
 * Supports hierarchical structure and version control
 */
export class Topic extends AbstractBaseEntity implements IVersionable, IComposite<Topic>, IComponent<Topic> {
  public name: string;
  public content: string;
  public version: number;
  public originalId?: string;
  public isCurrentVersion: boolean;
  public parentTopicId?: string | undefined;

  private children: Map<string, Topic> = new Map();
  private parent: Topic | null = null;
  private resources: Map<string, IResourceData> = new Map();

  constructor(
    name: string,
    content: string,
    parentTopicId?: string,
    id?: string,
    version: number = 1
  ) {
    super(id);
    this.name = name;
    this.content = content;
    this.version = version;
    this.isCurrentVersion = true;
    this.parentTopicId = parentTopicId ?? undefined;
  }

  // IVersionable implementation
  public createNewVersion(): Topic {
    const newVersion = new Topic(
      this.name,
      this.content,
      this.parentTopicId,
      undefined,
      this.version + 1
    );
    newVersion.originalId = this.originalId || this.id;
    this.isCurrentVersion = false;
    return newVersion;
  }

  public getVersion(): number {
    return this.version;
  }

  public isCurrentVersionEntity(): boolean {
    return this.isCurrentVersion;
  }

  // IComposite implementation
  public add(component: Topic): void {
    component.setParent(this);
    component.parentTopicId = this.id;
    this.children.set(component.id, component);
    this.updateTimestamp();
  }

  public remove(component: Topic): void {
    if (this.children.has(component.id)) {
      component.setParent(null);
      component.parentTopicId = undefined;
      this.children.delete(component.id);
      this.updateTimestamp();
    }
  }

  public getChild(id: string): Topic | null {
    return this.children.get(id) || null;
  }

  public getChildren(): Topic[] {
    return Array.from(this.children.values());
  }

  public hasChildren(): boolean {
    return this.children.size > 0;
  }

  // IComponent implementation
  public getId(): string {
    return this.id;
  }

  public getParent(): Topic | null {
    return this.parent;
  }

  public setParent(parent: Topic | null): void {
    this.parent = parent;
  }

  public operation(): void {
    // Perform operation on this topic and all children
    this.updateTimestamp();
    for (const child of this.children.values()) {
      child.operation();
    }
  }

  // Resource management
  public addResource(resource: IResourceData): void {
    this.resources.set(resource.id, resource);
    this.updateTimestamp();
  }

  public removeResource(resourceId: string): void {
    this.resources.delete(resourceId);
    this.updateTimestamp();
  }

  public getResources(): IResourceData[] {
    return Array.from(this.resources.values());
  }

  // Update methods
  public updateContent(name?: string, content?: string): void {
    if (name !== undefined) {
      this.name = name;
    }
    if (content !== undefined) {
      this.content = content;
    }
    this.updateTimestamp();
  }

  // Validation
  public validate(): boolean {
    return (
      this.name.trim().length > 0 &&
      this.content.trim().length > 0 &&
      this.version > 0
    );
  }

  // Serialization
  public override toJSON(): ITopicData {
    return {
      id: this.id,
      name: this.name,
      content: this.content,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      version: this.version,
      ...(this.parentTopicId && { parentTopicId: this.parentTopicId })
    };
  }

  public static override fromJSON(data: ITopicData): Topic {
    const topic = new Topic(
      data.name,
      data.content,
      data.parentTopicId,
      data.id,
      data.version
    );
    // Note: createdAt and updatedAt are readonly, so we can't modify them directly
    // They are set in the constructor
    return topic;
  }

  // Utility methods
  public getDepth(): number {
    let depth = 0;
    let current: Topic | null = this.parent;
    while (current) {
      depth++;
      current = current.getParent();
    }
    return depth;
  }

  public getPath(): string[] {
    const path: string[] = [];
    let current: Topic | null = this;
    while (current) {
      path.unshift(current.name);
      current = current.getParent();
    }
    return path;
  }

  public getAllDescendants(): Topic[] {
    const descendants: Topic[] = [];
    for (const child of this.children.values()) {
      descendants.push(child);
      descendants.push(...child.getAllDescendants());
    }
    return descendants;
  }
}
