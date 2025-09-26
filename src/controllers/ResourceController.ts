import { Request, Response, NextFunction } from 'express';
import { ResourceService } from '../services/ResourceService';
import { Validator } from '../utils/validation';
import { NotFoundError } from '../utils/errors';
import { ApiResponse, IResourceData, ResourceType } from '../types';

/**
 * Controller for resource-related operations
 */
export class ResourceController {
  private resourceService: ResourceService;

  constructor() {
    this.resourceService = new ResourceService();
  }

  /**
   * Creates a new resource
   */
  public createResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const validatedData = Validator.validateResourceCreate(req.body);
      
      const resource = await this.resourceService.createResource(validatedData, userId);
      
      const response: ApiResponse<IResourceData> = {
        success: true,
        data: resource,
        message: 'Resource created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets a resource by ID
   */
  public getResourceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resourceId = Validator.validateId(req.params.id!, 'Resource ID');
      
      const resource = await this.resourceService.getResourceById(resourceId);
      
      if (!resource) {
        throw new NotFoundError('Resource', resourceId);
      }

      const response: ApiResponse<IResourceData> = {
        success: true,
        data: resource,
        message: 'Resource retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets all resources with pagination
   */
  public getAllResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paginationOptions = Validator.validatePagination(req.query);
      
      const resources = await this.resourceService.getAllResources(paginationOptions);
      
      const response: ApiResponse<IResourceData[]> = {
        success: true,
        data: resources,
        message: 'Resources retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets resources by topic ID
   */
  public getResourcesByTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topicId = Validator.validateId(req.params.topicId!, 'Topic ID');
      
      const resources = await this.resourceService.getResourcesByTopic(topicId);
      
      const response: ApiResponse<IResourceData[]> = {
        success: true,
        data: resources,
        message: 'Topic resources retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets resources by type
   */
  public getResourcesByType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const type = req.params.type as ResourceType;
      
      // Validate resource type
      if (!Object.values(ResourceType).includes(type)) {
        throw new Error(`Invalid resource type: ${type}`);
      }
      
      const resources = await this.resourceService.getResourcesByType(type);
      
      const response: ApiResponse<IResourceData[]> = {
        success: true,
        data: resources,
        message: `Resources of type '${type}' retrieved successfully`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates a resource
   */
  public updateResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resourceId = Validator.validateId(req.params.id!, 'Resource ID');
      const userId = req.userId!;
      const validatedData = Validator.validateResourceUpdate(req.body);
      
      const updatedResource = await this.resourceService.updateResource(
        resourceId, 
        validatedData, 
        userId
      );
      
      const response: ApiResponse<IResourceData> = {
        success: true,
        data: updatedResource,
        message: 'Resource updated successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletes a resource
   */
  public deleteResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const resourceId = Validator.validateId(req.params.id!, 'Resource ID');
      const userId = req.userId!;
      
      const deleted = await this.resourceService.deleteResource(resourceId, userId);
      
      if (!deleted) {
        throw new NotFoundError('Resource', resourceId);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Resource deleted successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Searches resources by description or URL
   */
  public searchResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q: query } = Validator.validateSearch(req.query);
      const paginationOptions = Validator.validatePagination(req.query);
      
      const resources = await this.resourceService.searchResources(query, paginationOptions);
      
      const response: ApiResponse<IResourceData[]> = {
        success: true,
        data: resources,
        message: `Found ${resources.length} resources matching "${query}"`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates a video resource
   */
  public createVideoResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const { topicId, url, description } = req.body;
      
      // Basic validation
      if (!topicId || !url || !description) {
        throw new Error('topicId, url, and description are required');
      }
      
      const resource = await this.resourceService.createVideoResource(
        topicId, 
        url, 
        description, 
        userId
      );
      
      const response: ApiResponse<IResourceData> = {
        success: true,
        data: resource,
        message: 'Video resource created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates an article resource
   */
  public createArticleResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const { topicId, url, description } = req.body;
      
      // Basic validation
      if (!topicId || !url || !description) {
        throw new Error('topicId, url, and description are required');
      }
      
      const resource = await this.resourceService.createArticleResource(
        topicId, 
        url, 
        description, 
        userId
      );
      
      const response: ApiResponse<IResourceData> = {
        success: true,
        data: resource,
        message: 'Article resource created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates a PDF resource
   */
  public createPdfResource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const { topicId, url, description } = req.body;
      
      // Basic validation
      if (!topicId || !url || !description) {
        throw new Error('topicId, url, and description are required');
      }
      
      const resource = await this.resourceService.createPdfResource(
        topicId, 
        url, 
        description, 
        userId
      );
      
      const response: ApiResponse<IResourceData> = {
        success: true,
        data: resource,
        message: 'PDF resource created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Creates a resource with auto-detected type
   */
  public createResourceWithAutoType = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const { topicId, url, description } = req.body;
      
      // Basic validation
      if (!topicId || !url || !description) {
        throw new Error('topicId, url, and description are required');
      }
      
      const resource = await this.resourceService.createResourceWithAutoType(
        topicId, 
        url, 
        description, 
        userId
      );
      
      const response: ApiResponse<IResourceData> = {
        success: true,
        data: resource,
        message: 'Resource created successfully with auto-detected type'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Moves resources to a different topic
   */
  public moveResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const { resourceIds, newTopicId } = req.body;
      
      if (!Array.isArray(resourceIds) || !newTopicId) {
        throw new Error('resourceIds (array) and newTopicId are required');
      }
      
      // Validate all resource IDs
      resourceIds.forEach(id => Validator.validateId(id, 'Resource ID'));
      Validator.validateId(newTopicId, 'New Topic ID');
      
      const movedResources = await this.resourceService.moveResources(
        resourceIds, 
        newTopicId, 
        userId
      );
      
      const response: ApiResponse<IResourceData[]> = {
        success: true,
        data: movedResources,
        message: `${movedResources.length} resources moved successfully`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk creates resources
   */
  public bulkCreateResources = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const { resources } = req.body;
      
      if (!Array.isArray(resources)) {
        throw new Error('resources must be an array');
      }
      
      // Validate each resource
      const validatedResources = resources.map(resource => 
        Validator.validateResourceCreate(resource)
      );
      
      const createdResources = await this.resourceService.bulkCreateResources(
        validatedResources, 
        userId
      );
      
      const response: ApiResponse<IResourceData[]> = {
        success: true,
        data: createdResources,
        message: `${createdResources.length} resources created successfully`
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets resource statistics
   */
  public getResourceStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.resourceService.getResourceStats();
      
      const response: ApiResponse = {
        success: true,
        data: stats,
        message: 'Resource statistics retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validates a resource URL
   */
  public validateResourceUrl = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { url } = req.body;
      
      if (!url) {
        throw new Error('URL is required');
      }
      
      const validation = await this.resourceService.validateResourceUrl(url);
      
      const response: ApiResponse = {
        success: true,
        data: validation,
        message: 'URL validation completed'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Finds duplicate resources
   */
  public findDuplicateResources = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const duplicates = await this.resourceService.findDuplicateResources();
      
      const response: ApiResponse = {
        success: true,
        data: duplicates,
        message: `Found ${duplicates.length} sets of duplicate resources`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cleans up orphaned resources
   */
  public cleanupOrphanedResources = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cleanup = await this.resourceService.cleanupOrphanedResources();
      
      const response: ApiResponse = {
        success: true,
        data: cleanup,
        message: `Cleaned up ${cleanup.orphanedCount} orphaned resources`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
