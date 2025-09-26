import { Request, Response, NextFunction } from 'express';
import { TopicService } from '../services/TopicService';
import { Validator } from '../utils/validation';
import { NotFoundError, ValidationError } from '../utils/errors';
import { ApiResponse, ITopicData, ITopicHierarchy } from '../types';

/**
 * Controller for topic-related operations
 */
export class TopicController {
  private topicService: TopicService;

  constructor() {
    this.topicService = new TopicService();
  }

  /**
   * Creates a new topic
   */
  public createTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const validatedData = Validator.validateTopicCreate(req.body);
      
      const topic = await this.topicService.createTopic(validatedData, userId);
      
      const response: ApiResponse<ITopicData> = {
        success: true,
        data: topic,
        message: 'Topic created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets a topic by ID
   */
  public getTopicById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topicId = Validator.validateId(req.params.id!, 'Topic ID');
      const queryOptions = Validator.validateTopicHierarchyQuery(req.query);
      
      const topic = await this.topicService.getTopicById(topicId, queryOptions);
      
      if (!topic) {
        throw new NotFoundError('Topic', topicId);
      }

      const response: ApiResponse<ITopicHierarchy> = {
        success: true,
        data: topic,
        message: 'Topic retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets all topics with pagination
   */
  public getAllTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const paginationOptions = Validator.validatePagination(req.query);
      
      const topics = await this.topicService.getAllTopics(paginationOptions);
      
      const response: ApiResponse<ITopicData[]> = {
        success: true,
        data: topics,
        message: 'Topics retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Updates a topic (creates new version)
   */
  public updateTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topicId = Validator.validateId(req.params.id!, 'Topic ID');
      const userId = req.userId!;
      const validatedData = Validator.validateTopicUpdate(req.body);
      
      const updatedTopic = await this.topicService.updateTopic(topicId, validatedData, userId);
      
      const response: ApiResponse<ITopicData> = {
        success: true,
        data: updatedTopic,
        message: 'Topic updated successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deletes a topic
   */
  public deleteTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topicId = Validator.validateId(req.params.id!, 'Topic ID');
      const userId = req.userId!;
      
      const deleted = await this.topicService.deleteTopic(topicId, userId);
      
      if (!deleted) {
        throw new NotFoundError('Topic', topicId);
      }

      const response: ApiResponse = {
        success: true,
        message: 'Topic deleted successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets a specific version of a topic
   */
  public getTopicVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topicId = Validator.validateId(req.params.id!, 'Topic ID');
      const version = parseInt(req.params.version!);
      
      const topicVersion = await this.topicService.getTopicVersion(topicId, version);
      
      if (!topicVersion) {
        throw new NotFoundError(`Topic version ${version}`, topicId);
      }

      const response: ApiResponse = {
        success: true,
        data: topicVersion,
        message: 'Topic version retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets all versions of a topic
   */
  public getTopicVersions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topicId = Validator.validateId(req.params.id!, 'Topic ID');
      
      const versions = await this.topicService.getTopicVersions(topicId);
      
      const response: ApiResponse = {
        success: true,
        data: versions,
        message: 'Topic versions retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reverts a topic to a previous version
   */
  public revertTopicVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topicId = Validator.validateId(req.params.id!, 'Topic ID');
      const version = parseInt(req.params.version!);
      const userId = req.userId!;
      
      if (isNaN(version) || version < 1) {
        throw new ValidationError('Version must be a positive integer');
      }
      
      const revertedTopic = await this.topicService.revertToVersion(topicId, version, userId);
      
      const response: ApiResponse<ITopicData> = {
        success: true,
        data: revertedTopic,
        message: `Topic reverted to version ${version} successfully`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets the complete topic hierarchy (recursive retrieval)
   */
  public getTopicHierarchy = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topicId = Validator.validateId(req.params.id!, 'Topic ID');
      
      const hierarchy = await this.topicService.getTopicHierarchy(topicId);
      
      if (!hierarchy) {
        throw new NotFoundError('Topic', topicId);
      }

      const response: ApiResponse<ITopicHierarchy> = {
        success: true,
        data: hierarchy,
        message: 'Topic hierarchy retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets all root topics with their hierarchies
   */
  public getRootTopics = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rootTopics = await this.topicService.getRootTopics();
      
      const response: ApiResponse<ITopicHierarchy[]> = {
        success: true,
        data: rootTopics,
        message: 'Root topics retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Finds the shortest path between two topics (POST request)
   */
  public findShortestPath = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startId, endId } = Validator.validatePathFinding(req.body);
      
      const path = await this.topicService.findShortestPath(startId, endId);
      
      if (!path) {
        const response: ApiResponse = {
          success: true,
          data: null,
          message: 'No path found between the specified topics'
        };
        res.json(response);
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: path,
        message: 'Shortest path found successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets the shortest path between two topics (GET request with query params)
   */
  public getShortestPath = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const startTopicId = req.query.startTopicId as string;
      const endTopicId = req.query.endTopicId as string;
      
      if (!startTopicId || !endTopicId) {
        throw new ValidationError('Both startTopicId and endTopicId query parameters are required');
      }
      
      const startId = Validator.validateId(startTopicId, 'Start Topic ID');
      const endId = Validator.validateId(endTopicId, 'End Topic ID');
      
      const path = await this.topicService.findShortestPath(startId, endId);
      
      if (!path) {
        throw new NotFoundError('Path', `between ${startId} and ${endId}`);
      }

      const response: ApiResponse = {
        success: true,
        data: path,
        message: 'Shortest path found successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Searches topics by name or content
   */
  public searchTopics = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q: query } = Validator.validateSearch(req.query);
      const paginationOptions = Validator.validatePagination(req.query);
      
      const topics = await this.topicService.searchTopics(query, paginationOptions);
      
      const response: ApiResponse<ITopicData[]> = {
        success: true,
        data: topics,
        message: `Found ${topics.length} topics matching "${query}"`
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Moves a topic to a new parent
   */
  public moveTopic = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topicId = Validator.validateId(req.params.id!, 'Topic ID');
      const userId = req.userId!;
      
      const { parentTopicId } = req.body;
      
      // Validate parent topic ID if provided
      if (parentTopicId !== null && parentTopicId !== undefined) {
        Validator.validateId(parentTopicId, 'Parent Topic ID');
      }
      
      const movedTopic = await this.topicService.moveTopic(topicId, parentTopicId, userId);
      
      const response: ApiResponse<ITopicData> = {
        success: true,
        data: movedTopic,
        message: 'Topic moved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets topic statistics
   */
  public getTopicStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.topicService.getTopicStats();
      
      const response: ApiResponse = {
        success: true,
        data: stats,
        message: 'Topic statistics retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Gets children of a specific topic
   */
  public getTopicChildren = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const topicId = Validator.validateId(req.params.id!, 'Topic ID');
      
      const children = await this.topicService.getTopicChildren(topicId);
      
      const response: ApiResponse<ITopicHierarchy[]> = {
        success: true,
        data: children,
        message: 'Topic children retrieved successfully'
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
