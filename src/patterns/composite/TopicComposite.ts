import { Topic } from '../../models/Topic';
import { ITopicHierarchy } from '../../types';

/**
 * Composite pattern implementation for hierarchical topic structure
 * Allows treating individual topics and topic hierarchies uniformly
 */
export abstract class TopicComponent {
  protected id: string;
  protected name: string;
  protected parent: TopicComposite | null = null;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }

  public abstract operation(): void;
  public abstract accept(visitor: TopicVisitor): void;
  public abstract getSize(): number;
  public abstract toHierarchy(): ITopicHierarchy;

  public getId(): string {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getParent(): TopicComposite | null {
    return this.parent;
  }

  public setParent(parent: TopicComposite | null): void {
    this.parent = parent;
  }
}

/**
 * Leaf component - represents a single topic without children
 */
export class TopicLeaf extends TopicComponent {
  private topic: Topic;

  constructor(topic: Topic) {
    super(topic.getId(), topic.name);
    this.topic = topic;
  }

  public operation(): void {
    console.log(`Processing topic: ${this.name}`);
    this.topic.operation();
  }

  public accept(visitor: TopicVisitor): void {
    visitor.visitLeaf(this);
  }

  public getSize(): number {
    return 1;
  }

  public getTopic(): Topic {
    return this.topic;
  }

  public toHierarchy(): ITopicHierarchy {
    const topicData = this.topic.toJSON();
    return {
      ...topicData,
      children: [],
      resources: this.topic.getResources()
    };
  }
}

/**
 * Composite component - represents a topic with children
 */
export class TopicComposite extends TopicComponent {
  private children: Map<string, TopicComponent> = new Map();
  private topic: Topic;

  constructor(topic: Topic) {
    super(topic.getId(), topic.name);
    this.topic = topic;
  }

  public add(component: TopicComponent): void {
    component.setParent(this);
    this.children.set(component.getId(), component);
    
    // If the component is a leaf, add the actual topic to the Topic model
    if (component instanceof TopicLeaf) {
      this.topic.add(component.getTopic());
    }
  }

  public remove(component: TopicComponent): void {
    if (this.children.has(component.getId())) {
      component.setParent(null);
      this.children.delete(component.getId());
      
      // If the component is a leaf, remove the actual topic from the Topic model
      if (component instanceof TopicLeaf) {
        this.topic.remove(component.getTopic());
      }
    }
  }

  public getChild(id: string): TopicComponent | null {
    return this.children.get(id) || null;
  }

  public getChildren(): TopicComponent[] {
    return Array.from(this.children.values());
  }

  public hasChildren(): boolean {
    return this.children.size > 0;
  }

  public operation(): void {
    console.log(`Processing composite topic: ${this.name}`);
    this.topic.operation();
    
    // Process all children
    for (const child of this.children.values()) {
      child.operation();
    }
  }

  public accept(visitor: TopicVisitor): void {
    visitor.visitComposite(this);
    
    // Visit all children
    for (const child of this.children.values()) {
      child.accept(visitor);
    }
  }

  public getSize(): number {
    let size = 1; // Count this composite
    for (const child of this.children.values()) {
      size += child.getSize();
    }
    return size;
  }

  public getTopic(): Topic {
    return this.topic;
  }

  public toHierarchy(): ITopicHierarchy {
    const topicData = this.topic.toJSON();
    const children = Array.from(this.children.values()).map(child => child.toHierarchy());
    
    return {
      ...topicData,
      children,
      resources: this.topic.getResources()
    };
  }

  // Additional methods for hierarchy management
  public findById(id: string): TopicComponent | null {
    if (this.id === id) {
      return this;
    }

    for (const child of this.children.values()) {
      if (child.getId() === id) {
        return child;
      }
      
      if (child instanceof TopicComposite) {
        const found = child.findById(id);
        if (found) {
          return found;
        }
      }
    }

    return null;
  }

  public findByName(name: string): TopicComponent[] {
    const results: TopicComponent[] = [];
    
    if (this.name.toLowerCase().includes(name.toLowerCase())) {
      results.push(this);
    }

    for (const child of this.children.values()) {
      if (child.getName().toLowerCase().includes(name.toLowerCase())) {
        results.push(child);
      }
      
      if (child instanceof TopicComposite) {
        results.push(...child.findByName(name));
      }
    }

    return results;
  }

  public getDepth(): number {
    let maxDepth = 0;
    
    for (const child of this.children.values()) {
      let childDepth = 1;
      if (child instanceof TopicComposite) {
        childDepth += child.getDepth();
      }
      maxDepth = Math.max(maxDepth, childDepth);
    }
    
    return maxDepth;
  }

  public getAllLeaves(): TopicLeaf[] {
    const leaves: TopicLeaf[] = [];
    
    for (const child of this.children.values()) {
      if (child instanceof TopicLeaf) {
        leaves.push(child);
      } else if (child instanceof TopicComposite) {
        leaves.push(...child.getAllLeaves());
      }
    }
    
    return leaves;
  }
}

/**
 * Visitor pattern interface for topic operations
 */
export interface TopicVisitor {
  visitLeaf(leaf: TopicLeaf): void;
  visitComposite(composite: TopicComposite): void;
}

/**
 * Concrete visitor implementations
 */
export class TopicPrintVisitor implements TopicVisitor {
  private depth = 0;

  public visitLeaf(leaf: TopicLeaf): void {
    const indent = '  '.repeat(this.depth);
    console.log(`${indent}📄 ${leaf.getName()} (${leaf.getId()})`);
  }

  public visitComposite(composite: TopicComposite): void {
    const indent = '  '.repeat(this.depth);
    console.log(`${indent}📁 ${composite.getName()} (${composite.getId()}) [${composite.getChildren().length} children]`);
    this.depth++;
    
    // Children will be visited automatically by the composite's accept method
    // Reset depth after visiting
    setTimeout(() => {
      this.depth--;
    }, 0);
  }
}

export class TopicCountVisitor implements TopicVisitor {
  private leafCount = 0;
  private compositeCount = 0;

  public visitLeaf(_leaf: TopicLeaf): void {
    this.leafCount++;
  }

  public visitComposite(_composite: TopicComposite): void {
    this.compositeCount++;
  }

  public getLeafCount(): number {
    return this.leafCount;
  }

  public getCompositeCount(): number {
    return this.compositeCount;
  }

  public getTotalCount(): number {
    return this.leafCount + this.compositeCount;
  }

  public reset(): void {
    this.leafCount = 0;
    this.compositeCount = 0;
  }
}

export class TopicSearchVisitor implements TopicVisitor {
  private searchTerm: string;
  private results: TopicComponent[] = [];

  constructor(searchTerm: string) {
    this.searchTerm = searchTerm.toLowerCase();
  }

  public visitLeaf(leaf: TopicLeaf): void {
    if (leaf.getName().toLowerCase().includes(this.searchTerm)) {
      this.results.push(leaf);
    }
  }

  public visitComposite(composite: TopicComposite): void {
    if (composite.getName().toLowerCase().includes(this.searchTerm)) {
      this.results.push(composite);
    }
  }

  public getResults(): TopicComponent[] {
    return this.results;
  }

  public reset(): void {
    this.results = [];
  }
}

/**
 * Factory for creating topic components
 */
export class TopicComponentFactory {
  public static createLeaf(topic: Topic): TopicLeaf {
    return new TopicLeaf(topic);
  }

  public static createComposite(topic: Topic): TopicComposite {
    return new TopicComposite(topic);
  }

  public static createFromTopic(topic: Topic): TopicComponent {
    if (topic.hasChildren()) {
      return new TopicComposite(topic);
    } else {
      return new TopicLeaf(topic);
    }
  }

  public static buildHierarchy(topics: Topic[]): TopicComposite | null {
    if (topics.length === 0) return null;

    const topicMap = new Map<string, TopicComponent>();
    const rootTopics: TopicComponent[] = [];

    // First pass: create all components
    for (const topic of topics) {
      const component = this.createFromTopic(topic);
      topicMap.set(topic.getId(), component);
    }

    // Second pass: build hierarchy
    for (const topic of topics) {
      const component = topicMap.get(topic.getId())!;
      
      if (topic.parentTopicId) {
        const parent = topicMap.get(topic.parentTopicId);
        if (parent instanceof TopicComposite) {
          parent.add(component);
        }
      } else {
        rootTopics.push(component);
      }
    }

    // If there's only one root, return it
    if (rootTopics.length === 1 && rootTopics[0] instanceof TopicComposite) {
      return rootTopics[0];
    }

    // If there are multiple roots, create a virtual root
    if (rootTopics.length > 0) {
      const virtualRootTopic = new Topic('Virtual Root', 'Root container for multiple topics');
      const virtualRoot = new TopicComposite(virtualRootTopic);
      
      for (const root of rootTopics) {
        virtualRoot.add(root);
      }
      
      return virtualRoot;
    }

    return null;
  }
}
