import { DatabaseManager } from '../database/DatabaseManager';
import { Resource } from '../models/Resource';
import { EntityFactory, ResourceFactory } from '../patterns/factory/EntityFactory';
import { 
  IResourceData, 
  CreateResourceRequest, 
  ResourceType,
  QueryOptions 
} from '../types';

/**
 * Service class for managing resources associated with topics
 */
export class ResourceService {
  private dbManager: DatabaseManager;
  private resourcesDb;
  private topicsDb;

  constructor(dbManager?: DatabaseManager) {
    this.dbManager = dbManager || DatabaseManager.getInstance();
    this.resourcesDb = this.dbManager.getResourcesDatabase();
    this.topicsDb = this.dbManager.getTopicsDatabase();
  }

  /**
   * Creates a new resource
   */
  public async createResource(request: CreateResourceRequest, _userId: string): Promise<IResourceData> {
    // Validate topic exists
    const topicExists = await this.topicsDb.exists(request.topicId);
    if (!topicExists) {
      throw new Error(`Topic with ID ${request.topicId} not found`);
    }

    // Create resource using factory
    const resource = EntityFactory.createResource({
      topicId: request.topicId,
      url: request.url,
      description: request.description,
      type: request.type
    });

    if (!resource.validate()) {
      throw new Error('Invalid resource data');
    }

    // Save to database
    const resourceData = resource.toJSON();
    return await this.resourcesDb.create(resourceData);
  }

  /**
   * Gets a resource by ID
   */
  public async getResourceById(id: string): Promise<IResourceData | null> {
    return await this.resourcesDb.findById(id);
  }

  /**
   * Gets all resources with optional filtering
   */
  public async getAllResources(options: QueryOptions = {}): Promise<IResourceData[]> {
    let resources = await this.resourcesDb.find();

    // Apply pagination if specified
    if (options.offset !== undefined || options.limit !== undefined) {
      const offset = options.offset || 0;
      const limit = options.limit || resources.length;
      resources = resources.slice(offset, offset + limit);
    }

    return resources;
  }

  /**
   * Gets all resources for a specific topic
   */
  public async getResourcesByTopic(topicId: string): Promise<IResourceData[]> {
    return await this.resourcesDb.findByField('topicId', topicId);
  }

  /**
   * Gets resources by type
   */
  public async getResourcesByType(type: ResourceType): Promise<IResourceData[]> {
    return await this.resourcesDb.findByField('type', type);
  }

  /**
   * Updates a resource
   */
  public async updateResource(
    id: string, 
    updates: {
      url?: string;
      description?: string;
      type?: ResourceType;
    },
    _userId: string
  ): Promise<IResourceData> {
    const existingResource = await this.resourcesDb.findById(id);
    if (!existingResource) {
      throw new Error(`Resource with ID ${id} not found`);
    }

    // Create resource object for validation
    const resource = Resource.fromJSON(existingResource);
    resource.updateResource(updates.url, updates.description, updates.type);

    if (!resource.validate()) {
      throw new Error('Invalid resource data');
    }

    // Update in database
    const updatedResource = await this.resourcesDb.update(id, {
      url: resource.url,
      description: resource.description,
      type: resource.type,
      updatedAt: new Date()
    });

    if (!updatedResource) {
      throw new Error('Failed to update resource');
    }

    return updatedResource;
  }

  /**
   * Deletes a resource
   */
  public async deleteResource(id: string, _userId: string): Promise<boolean> {
    return await this.resourcesDb.delete(id);
  }

  /**
   * Searches resources by description or URL
   */
  public async searchResources(
    query: string, 
    options: QueryOptions = {}
  ): Promise<IResourceData[]> {
    const allResources = await this.getAllResources();
    const searchTerm = query.toLowerCase();

    let results = allResources.filter(resource => 
      resource.description.toLowerCase().includes(searchTerm) ||
      resource.url.toLowerCase().includes(searchTerm)
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
   * Creates a video resource
   */
  public async createVideoResource(
    topicId: string, 
    url: string, 
    description: string, 
    _userId: string
  ): Promise<IResourceData> {
    return await this.createResource({
      topicId,
      url,
      description,
      type: ResourceType.VIDEO
    }, _userId);
  }

  /**
   * Creates an article resource
   */
  public async createArticleResource(
    topicId: string, 
    url: string, 
    description: string, 
    _userId: string
  ): Promise<IResourceData> {
    return await this.createResource({
      topicId,
      url,
      description,
      type: ResourceType.ARTICLE
    }, _userId);
  }

  /**
   * Creates a PDF resource
   */
  public async createPdfResource(
    topicId: string, 
    url: string, 
    description: string, 
    _userId: string
  ): Promise<IResourceData> {
    return await this.createResource({
      topicId,
      url,
      description,
      type: ResourceType.PDF
    }, _userId);
  }

  /**
   * Creates a resource with auto-detected type
   */
  public async createResourceWithAutoType(
    topicId: string, 
    url: string, 
    description: string, 
    _userId: string
  ): Promise<IResourceData> {
    const resource = ResourceFactory.createResourceWithAutoType({
      topicId,
      url,
      description
    });

    if (!resource.validate()) {
      throw new Error('Invalid resource data');
    }

    return await this.resourcesDb.create(resource.toJSON());
  }

  /**
   * Moves resources from one topic to another
   */
  public async moveResources(
    resourceIds: string[], 
    newTopicId: string, 
    _userId: string
  ): Promise<IResourceData[]> {
    // Validate new topic exists
    const topicExists = await this.topicsDb.exists(newTopicId);
    if (!topicExists) {
      throw new Error(`Topic with ID ${newTopicId} not found`);
    }

    const updatedResources: IResourceData[] = [];

    for (const resourceId of resourceIds) {
      const resource = await this.resourcesDb.findById(resourceId);
      if (resource) {
        const updated = await this.resourcesDb.update(resourceId, {
          topicId: newTopicId,
          updatedAt: new Date()
        });
        if (updated) {
          updatedResources.push(updated);
        }
      }
    }

    return updatedResources;
  }

  /**
   * Bulk creates resources
   */
  public async bulkCreateResources(
    resources: CreateResourceRequest[], 
    _userId: string
  ): Promise<IResourceData[]> {
    const createdResources: IResourceData[] = [];

    for (const resourceRequest of resources) {
      try {
        const created = await this.createResource(resourceRequest, _userId);
        createdResources.push(created);
      } catch (error) {
        // Log error but continue with other resources
        console.error(`Failed to create resource for topic ${resourceRequest.topicId}:`, error);
      }
    }

    return createdResources;
  }

  /**
   * Gets resource statistics
   */
  public async getResourceStats(): Promise<{
    totalResources: number;
    resourcesByType: Record<ResourceType, number>;
    topicsWithResources: number;
    avgResourcesPerTopic: number;
    topResourceTypes: { type: ResourceType; count: number }[];
  }> {
    const allResources = await this.getAllResources();
    
    // Count by type
    const resourcesByType: Record<ResourceType, number> = {
      [ResourceType.VIDEO]: 0,
      [ResourceType.ARTICLE]: 0,
      [ResourceType.PDF]: 0,
      [ResourceType.LINK]: 0,
      [ResourceType.IMAGE]: 0
    };

    for (const resource of allResources) {
      resourcesByType[resource.type]++;
    }

    // Count unique topics with resources
    const topicsWithResources = new Set(allResources.map(r => r.topicId)).size;

    // Calculate average resources per topic
    const avgResourcesPerTopic = topicsWithResources > 0 
      ? allResources.length / topicsWithResources 
      : 0;

    // Get top resource types
    const topResourceTypes = Object.entries(resourcesByType)
      .map(([type, count]) => ({ type: type as ResourceType, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalResources: allResources.length,
      resourcesByType,
      topicsWithResources,
      avgResourcesPerTopic,
      topResourceTypes
    };
  }

  /**
   * Validates a resource URL
   */
  public async validateResourceUrl(url: string): Promise<{
    isValid: boolean;
    type: ResourceType;
    metadata?: {
      domain?: string;
      extension?: string;
      isImage?: boolean;
      isVideo?: boolean;
      isPdf?: boolean;
    };
  }> {
    try {
      const urlObj = new URL(url);
      const resource = ResourceFactory.createResourceWithAutoType({
        topicId: 'temp',
        url,
        description: 'temp'
      });

      return {
        isValid: resource.validate(),
        type: resource.type,
        metadata: {
          domain: urlObj.hostname,
          ...(resource.getFileExtension() ? { extension: resource.getFileExtension()! } : {}),
          isImage: resource.isImageResource(),
          isVideo: resource.isVideoResource(),
          isPdf: resource.isPdfResource()
        }
      };
    } catch {
      return {
        isValid: false,
        type: ResourceType.LINK
      };
    }
  }

  /**
   * Gets resources that might be duplicates based on URL
   */
  public async findDuplicateResources(): Promise<{
    url: string;
    resources: IResourceData[];
  }[]> {
    const allResources = await this.getAllResources();
    const urlMap = new Map<string, IResourceData[]>();

    // Group by URL
    for (const resource of allResources) {
      const normalizedUrl = resource.url.toLowerCase().trim();
      if (!urlMap.has(normalizedUrl)) {
        urlMap.set(normalizedUrl, []);
      }
      urlMap.get(normalizedUrl)!.push(resource);
    }

    // Return only URLs with duplicates
    return Array.from(urlMap.entries())
      .filter(([, resources]) => resources.length > 1)
      .map(([url, resources]) => ({ url, resources }));
  }

  /**
   * Cleans up orphaned resources (resources whose topics no longer exist)
   */
  public async cleanupOrphanedResources(): Promise<{
    orphanedCount: number;
    deletedResources: string[];
  }> {
    const allResources = await this.getAllResources();
    const deletedResources: string[] = [];

    for (const resource of allResources) {
      const topicExists = await this.topicsDb.exists(resource.topicId);
      if (!topicExists) {
        await this.resourcesDb.delete(resource.id);
        deletedResources.push(resource.id);
      }
    }

    return {
      orphanedCount: deletedResources.length,
      deletedResources
    };
  }
}
