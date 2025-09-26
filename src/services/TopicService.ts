import { DatabaseManager } from '../database/DatabaseManager';
import { Topic } from '../models/Topic';
import { TopicVersionFactory } from '../patterns/factory/EntityFactory';
import { TopicPathFinder } from '../algorithms/ShortestPathAlgorithm';
import { 
  ITopicData, 
  ITopicVersion, 
  ITopicHierarchy, 
  CreateTopicRequest, 
  UpdateTopicRequest, 
  ShortestPath,
  QueryOptions 
} from '../types';

/**
 * Service class for managing topics with version control and hierarchy support
 */
export class TopicService {
  private dbManager: DatabaseManager;
  private topicsDb;
  private versionsDb;
  private pathFinder: TopicPathFinder | null = null;

  constructor(dbManager?: DatabaseManager) {
    this.dbManager = dbManager || DatabaseManager.getInstance();
    this.topicsDb = this.dbManager.getTopicsDatabase();
    this.versionsDb = this.dbManager.getTopicVersionsDatabase();
  }

  /**
   * Creates a new topic
   */
  public async createTopic(request: CreateTopicRequest, _userId: string): Promise<ITopicData> {
    // Validate parent topic if specified
    if (request.parentTopicId) {
      const parentExists = await this.topicsDb.exists(request.parentTopicId);
      if (!parentExists) {
        throw new Error(`Parent topic with ID ${request.parentTopicId} not found`);
      }
    }

    // Create topic using factory
    const topic = TopicVersionFactory.createInitialVersion({
      name: request.name,
      content: request.content,
      ...(request.parentTopicId && { parentTopicId: request.parentTopicId })
    });

    if (!topic.validate()) {
      throw new Error('Invalid topic data');
    }

    // Save to database
    const topicData = topic.toJSON();
    const savedTopic = await this.topicsDb.create(topicData);

    // Create initial version record
    const versionData: ITopicVersion = {
      ...savedTopic,
      originalTopicId: savedTopic.id,
      isCurrentVersion: true
    };
    await this.versionsDb.create(versionData);

    // Invalidate path finder cache
    this.pathFinder = null;

    return savedTopic;
  }

  /**
   * Gets a topic by ID
   */
  public async getTopicById(
    id: string, 
    options: QueryOptions = {}
  ): Promise<ITopicHierarchy | null> {
    const topicData = await this.topicsDb.findById(id);
    if (!topicData) {
      return null;
    }

    let result: ITopicHierarchy = {
      ...topicData,
      children: [],
      resources: []
    };

    // Include children if requested
    if (options.includeChildren) {
      const children = await this.getTopicChildren(id);
      result.children = children;
    }

    // Include resources if requested
    if (options.includeResources) {
      const resourcesDb = this.dbManager.getResourcesDatabase();
      const resources = await resourcesDb.findByField('topicId', id);
      result.resources = resources;
    }

    return result;
  }

  /**
   * Gets all topics with optional filtering
   */
  public async getAllTopics(options: QueryOptions = {}): Promise<ITopicData[]> {
    let topics = await this.topicsDb.find();

    // Apply pagination if specified
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || topics.length;
      topics = topics.slice(offset, offset + limit);
    }

    return topics;
  }

  /**
   * Updates a topic (creates a new version)
   */
  public async updateTopic(
    id: string, 
    request: UpdateTopicRequest, 
    _userId: string
  ): Promise<ITopicData> {
    const currentTopic = await this.topicsDb.findById(id);
    if (!currentTopic) {
      throw new Error(`Topic with ID ${id} not found`);
    }

    // Validate parent topic if being changed
    if (request.parentTopicId !== undefined && request.parentTopicId !== currentTopic.parentTopicId) {
      if (request.parentTopicId) {
        const parentExists = await this.topicsDb.exists(request.parentTopicId);
        if (!parentExists) {
          throw new Error(`Parent topic with ID ${request.parentTopicId} not found`);
        }

        // Check for circular reference
        const wouldCreateCircle = await this.wouldCreateCircularReference(id, request.parentTopicId);
        if (wouldCreateCircle) {
          throw new Error('Cannot set parent: would create circular reference');
        }
      }
    }

    // Create new version
    const topic = Topic.fromJSON(currentTopic);
    const updateData: { name?: string; content?: string; parentTopicId?: string } = {};
    if (request.name) updateData.name = request.name;
    if (request.content) updateData.content = request.content;
    if (request.parentTopicId !== undefined) {
      if (request.parentTopicId !== null) {
        updateData.parentTopicId = request.parentTopicId;
      }
    }
    
    // Apply updates directly to the topic
    if (updateData.name) topic.name = updateData.name;
    if (updateData.content) topic.content = updateData.content;
    if (updateData.parentTopicId !== undefined) {
      topic.parentTopicId = updateData.parentTopicId;
    }
    
    // Increment version
    topic.version = topic.version + 1;
    topic.updatedAt = new Date();

    if (!topic.validate()) {
      throw new Error('Invalid topic data');
    }

    const newVersion = topic;

    // Mark current version as not current
    const currentVersions = await this.versionsDb.findByField('originalTopicId', currentTopic.id);
    for (const version of currentVersions) {
      if (version.isCurrentVersion) {
        await this.versionsDb.update(version.id, { isCurrentVersion: false });
      }
    }

    // Save new version to topics table (replace current)
    const newTopicData = newVersion.toJSON();
    const updatedTopic = await this.topicsDb.update(id, newTopicData);

    if (!updatedTopic) {
      throw new Error('Failed to update topic');
    }

    // Save version record
    const { v4: uuidv4 } = await import('uuid');
    const versionData: ITopicVersion = {
      id: uuidv4(),
      name: updatedTopic.name,
      content: updatedTopic.content,
      createdAt: updatedTopic.createdAt,
      updatedAt: updatedTopic.updatedAt,
      version: updatedTopic.version,
      ...(updatedTopic.parentTopicId && { parentTopicId: updatedTopic.parentTopicId }),
      originalTopicId: id,
      isCurrentVersion: true
    };
    await this.versionsDb.create(versionData);

    // Invalidate path finder cache
    this.pathFinder = null;

    return updatedTopic;
  }

  /**
   * Deletes a topic and all its versions
   */
  public async deleteTopic(id: string, _userId: string): Promise<boolean> {
    const topic = await this.topicsDb.findById(id);
    if (!topic) {
      return false;
    }

    // Check if topic has children
    const children = await this.getTopicChildren(id);
    if (children.length > 0) {
      throw new Error('Cannot delete topic with children. Delete children first or move them to another parent.');
    }

    // Delete all versions
    const versions = await this.versionsDb.findByField('originalTopicId', id);
    for (const version of versions) {
      await this.versionsDb.delete(version.id);
    }

    // Delete associated resources
    const resourcesDb = this.dbManager.getResourcesDatabase();
    const resources = await resourcesDb.findByField('topicId', id);
    for (const resource of resources) {
      await resourcesDb.delete(resource.id);
    }

    // Delete the topic
    const deleted = await this.topicsDb.delete(id);

    // Invalidate path finder cache
    this.pathFinder = null;

    return deleted;
  }

  /**
   * Gets a specific version of a topic
   */
  public async getTopicVersion(originalId: string, version: number): Promise<ITopicVersion | null> {
    const versions = await this.versionsDb.find({
      originalTopicId: originalId,
      version: version
    } as Partial<ITopicVersion>);

    return versions.length > 0 ? (versions[0] ?? null) : null;
  }

  /**
   * Gets all versions of a topic
   */
  public async getTopicVersions(originalId: string): Promise<ITopicVersion[]> {
    const versions = await this.versionsDb.findByField('originalTopicId', originalId);
    return versions.sort((a, b) => b.version - a.version); // Latest first
  }

  /**
   * Gets the current version of a topic
   */
  public async getCurrentVersion(originalId: string): Promise<ITopicVersion | null> {
    const versions = await this.versionsDb.find({
      originalTopicId: originalId,
      isCurrentVersion: true
    } as Partial<ITopicVersion>);

    return versions.length > 0 ? (versions[0] ?? null) : null;
  }

  /**
   * Reverts a topic to a previous version
   */
  public async revertToVersion(
    originalId: string, 
    version: number, 
    _userId: string
  ): Promise<ITopicData> {
    const targetVersion = await this.getTopicVersion(originalId, version);
    if (!targetVersion) {
      throw new Error(`Version ${version} not found for topic ${originalId}`);
    }

    const currentTopic = await this.topicsDb.findById(originalId);
    if (!currentTopic) {
      throw new Error(`Topic with ID ${originalId} not found`);
    }

    // Create a new version based on the target version
    const topic = Topic.fromJSON(currentTopic);
    
    // Apply the target version data
    topic.name = targetVersion.name;
    topic.content = targetVersion.content;
    if (targetVersion.parentTopicId !== undefined) {
      topic.parentTopicId = targetVersion.parentTopicId;
    }
    
    // Increment version and update timestamp
    topic.version = topic.version + 1;
    topic.updatedAt = new Date();

    // Update current topic
    const revertedData = topic.toJSON();
    const updatedTopic = await this.topicsDb.update(originalId, revertedData);

    if (!updatedTopic) {
      throw new Error('Failed to revert topic');
    }

    // Mark current versions as not current
    const currentVersions = await this.versionsDb.findByField('originalTopicId', originalId);
    for (const ver of currentVersions) {
      if (ver.isCurrentVersion) {
        await this.versionsDb.update(ver.id, { isCurrentVersion: false });
      }
    }

    // Save new version record
    const { v4: uuidv4 } = await import('uuid');
    const versionData: ITopicVersion = {
      id: uuidv4(),
      name: updatedTopic.name,
      content: updatedTopic.content,
      createdAt: updatedTopic.createdAt,
      updatedAt: updatedTopic.updatedAt,
      version: updatedTopic.version,
      ...(updatedTopic.parentTopicId && { parentTopicId: updatedTopic.parentTopicId }),
      originalTopicId: originalId,
      isCurrentVersion: true
    };
    await this.versionsDb.create(versionData);

    // Invalidate path finder cache
    this.pathFinder = null;

    return updatedTopic;
  }

  /**
   * Gets all child topics of a given topic
   */
  public async getTopicChildren(parentId: string): Promise<ITopicHierarchy[]> {
    const children = await this.topicsDb.findByField('parentTopicId', parentId);
    const result: ITopicHierarchy[] = [];

    for (const child of children) {
      const childHierarchy: ITopicHierarchy = {
        ...child,
        children: await this.getTopicChildren(child.id), // Recursive
        resources: []
      };

      // Get resources for this child
      const resourcesDb = this.dbManager.getResourcesDatabase();
      const resources = await resourcesDb.findByField('topicId', child.id);
      childHierarchy.resources = resources;

      result.push(childHierarchy);
    }

    return result;
  }

  /**
   * Gets the complete topic hierarchy starting from a root topic
   */
  public async getTopicHierarchy(rootId: string): Promise<ITopicHierarchy | null> {
    const rootTopic = await this.topicsDb.findById(rootId);
    if (!rootTopic) {
      return null;
    }

    return {
      ...rootTopic,
      children: await this.getTopicChildren(rootId),
      resources: await this.getTopicResources(rootId)
    };
  }

  /**
   * Gets all root topics (topics without parents)
   */
  public async getRootTopics(): Promise<ITopicHierarchy[]> {
    const rootTopics = await this.topicsDb.find();
    const roots = rootTopics.filter(topic => !topic.parentTopicId);
    
    const result: ITopicHierarchy[] = [];
    for (const root of roots) {
      result.push({
        ...root,
        children: await this.getTopicChildren(root.id),
        resources: await this.getTopicResources(root.id)
      });
    }

    return result;
  }

  /**
   * Finds the shortest path between two topics
   */
  public async findShortestPath(startId: string, endId: string): Promise<ShortestPath | null> {
    await this.ensurePathFinder();
    return this.pathFinder!.findShortestPath(startId, endId);
  }

  /**
   * Searches topics by name or content
   */
  public async searchTopics(
    query: string, 
    options: QueryOptions = {}
  ): Promise<ITopicData[]> {
    const allTopics = await this.getAllTopics();
    const searchTerm = query.toLowerCase();

    let results = allTopics.filter(topic => 
      topic.name.toLowerCase().includes(searchTerm) ||
      topic.content.toLowerCase().includes(searchTerm)
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
   * Moves a topic to a new parent
   */
  public async moveTopic(
    topicId: string, 
    newParentId: string | null, 
    userId: string
  ): Promise<ITopicData> {
    const topic = await this.topicsDb.findById(topicId);
    if (!topic) {
      throw new Error(`Topic with ID ${topicId} not found`);
    }

    // Validate new parent
    if (newParentId) {
      const parentExists = await this.topicsDb.exists(newParentId);
      if (!parentExists) {
        throw new Error(`Parent topic with ID ${newParentId} not found`);
      }

      // Check for circular reference
      const wouldCreateCircle = await this.wouldCreateCircularReference(topicId, newParentId);
      if (wouldCreateCircle) {
        throw new Error('Cannot move topic: would create circular reference');
      }
    }

    // Update the topic
    return await this.updateTopic(topicId, { parentTopicId: newParentId }, userId);
  }

  /**
   * Gets topic statistics
   */
  public async getTopicStats(): Promise<{
    totalTopics: number;
    totalVersions: number;
    rootTopics: number;
    maxDepth: number;
    avgChildrenPerTopic: number;
  }> {
    const allTopics = await this.getAllTopics();
    const allVersions = await this.versionsDb.find();
    const rootTopics = allTopics.filter(topic => !topic.parentTopicId);

    let maxDepth = 0;
    let totalChildren = 0;

    for (const topic of allTopics) {
      const depth = await this.calculateTopicDepth(topic.id);
      maxDepth = Math.max(maxDepth, depth);

      const children = await this.topicsDb.findByField('parentTopicId', topic.id);
      totalChildren += children.length;
    }

    return {
      totalTopics: allTopics.length,
      totalVersions: allVersions.length,
      rootTopics: rootTopics.length,
      maxDepth,
      avgChildrenPerTopic: allTopics.length > 0 ? totalChildren / allTopics.length : 0
    };
  }

  // Private helper methods

  private async ensurePathFinder(): Promise<void> {
    if (!this.pathFinder) {
      const allTopics = await this.getAllTopics();
      this.pathFinder = new TopicPathFinder(allTopics);
    }
  }

  private async getTopicResources(topicId: string): Promise<any[]> {
    const resourcesDb = this.dbManager.getResourcesDatabase();
    return await resourcesDb.findByField('topicId', topicId);
  }

  private async wouldCreateCircularReference(topicId: string, newParentId: string): Promise<boolean> {
    let currentId: string | undefined = newParentId;
    const visited = new Set<string>();

    while (currentId) {
      if (currentId === topicId) {
        return true; // Circular reference detected
      }

      if (visited.has(currentId)) {
        break; // Already visited, avoid infinite loop
      }

      visited.add(currentId);
      const parent = await this.topicsDb.findById(currentId);
      currentId = parent?.parentTopicId;
    }

    return false;
  }

  private async calculateTopicDepth(topicId: string): Promise<number> {
    let depth = 0;
    let currentId: string | undefined = topicId;

    while (currentId) {
      const topic = await this.topicsDb.findById(currentId);
      if (!topic?.parentTopicId) {
        break;
      }
      depth++;
      currentId = topic.parentTopicId;
    }

    return depth;
  }
}
