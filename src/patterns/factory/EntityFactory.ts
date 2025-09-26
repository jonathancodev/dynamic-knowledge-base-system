import { Topic, Resource, User } from '../../models';
import { ITopicData, IResourceData, IUserData, ResourceType, UserRole } from '../../types';

/**
 * Abstract Factory pattern implementation
 * Creates different types of entities based on provided data
 */
export abstract class EntityFactory {
  /**
   * Creates a Topic entity
   */
  public static createTopic(data: {
    name: string;
    content: string;
    parentTopicId?: string;
    id?: string;
    version?: number;
  }): Topic {
    return new Topic(
      data.name,
      data.content,
      data.parentTopicId,
      data.id,
      data.version
    );
  }

  /**
   * Creates a Topic from JSON data
   */
  public static createTopicFromJSON(data: ITopicData): Topic {
    return Topic.fromJSON(data);
  }

  /**
   * Creates a Resource entity
   */
  public static createResource(data: {
    topicId: string;
    url: string;
    description: string;
    type: ResourceType;
    id?: string;
  }): Resource {
    return new Resource(
      data.topicId,
      data.url,
      data.description,
      data.type,
      data.id
    );
  }

  /**
   * Creates a Resource from JSON data
   */
  public static createResourceFromJSON(data: IResourceData): Resource {
    return Resource.fromJSON(data);
  }

  /**
   * Creates a User entity
   */
  public static createUser(data: {
    name: string;
    email: string;
    role: UserRole;
    id?: string;
  }): User {
    return new User(
      data.name,
      data.email,
      data.role,
      data.id
    );
  }

  /**
   * Creates a User from JSON data
   */
  public static createUserFromJSON(data: IUserData): User {
    return User.fromJSON(data);
  }
}

/**
 * Topic Version Factory - specialized factory for creating topic versions
 */
export class TopicVersionFactory {
  /**
   * Creates a new version of an existing topic
   */
  public static createNewVersion(originalTopic: Topic, updates?: {
    name?: string;
    content?: string;
    parentTopicId?: string;
  }): Topic {
    const newVersion = originalTopic.createNewVersion();
    
    if (updates) {
      if (updates.name) newVersion.name = updates.name;
      if (updates.content) newVersion.content = updates.content;
      if (updates.parentTopicId !== undefined) {
        newVersion.parentTopicId = updates.parentTopicId;
      }
    }
    
    return newVersion;
  }

  /**
   * Creates a topic version from version data
   */
  public static createVersionFromData(data: {
    originalTopicId: string;
    name: string;
    content: string;
    version: number;
    parentTopicId?: string;
    id?: string;
  }): Topic {
    const topic = new Topic(
      data.name,
      data.content,
      data.parentTopicId,
      data.id,
      data.version
    );
    
    topic.originalId = data.originalTopicId;
    topic.isCurrentVersion = false; // Versions are not current by default
    
    return topic;
  }

  /**
   * Creates the initial version of a topic
   */
  public static createInitialVersion(data: {
    name: string;
    content: string;
    parentTopicId?: string;
    id?: string;
  }): Topic {
    const topic = EntityFactory.createTopic({
      ...data,
      version: 1
    });
    
    topic.isCurrentVersion = true;
    return topic;
  }
}

/**
 * Resource Factory with type-specific creation methods
 */
export class ResourceFactory {
  /**
   * Creates a video resource
   */
  public static createVideoResource(data: {
    topicId: string;
    url: string;
    description: string;
    id?: string;
  }): Resource {
    return EntityFactory.createResource({
      ...data,
      type: ResourceType.VIDEO
    });
  }

  /**
   * Creates an article resource
   */
  public static createArticleResource(data: {
    topicId: string;
    url: string;
    description: string;
    id?: string;
  }): Resource {
    return EntityFactory.createResource({
      ...data,
      type: ResourceType.ARTICLE
    });
  }

  /**
   * Creates a PDF resource
   */
  public static createPdfResource(data: {
    topicId: string;
    url: string;
    description: string;
    id?: string;
  }): Resource {
    return EntityFactory.createResource({
      ...data,
      type: ResourceType.PDF
    });
  }

  /**
   * Creates a generic link resource
   */
  public static createLinkResource(data: {
    topicId: string;
    url: string;
    description: string;
    id?: string;
  }): Resource {
    return EntityFactory.createResource({
      ...data,
      type: ResourceType.LINK
    });
  }

  /**
   * Creates an image resource
   */
  public static createImageResource(data: {
    topicId: string;
    url: string;
    description: string;
    id?: string;
  }): Resource {
    return EntityFactory.createResource({
      ...data,
      type: ResourceType.IMAGE
    });
  }

  /**
   * Auto-detects resource type and creates appropriate resource
   */
  public static createResourceWithAutoType(data: {
    topicId: string;
    url: string;
    description: string;
    id?: string;
  }): Resource {
    const type = this.detectResourceType(data.url);
    return EntityFactory.createResource({
      ...data,
      type
    });
  }

  private static detectResourceType(url: string): ResourceType {
    const lowerUrl = url.toLowerCase();
    
    // Video detection
    if (lowerUrl.includes('youtube.com') || 
        lowerUrl.includes('vimeo.com') ||
        lowerUrl.includes('dailymotion.com') ||
        /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(url)) {
      return ResourceType.VIDEO;
    }
    
    // PDF detection
    if (/\.pdf$/i.test(url)) {
      return ResourceType.PDF;
    }
    
    // Image detection
    if (/\.(jpg|jpeg|png|gif|svg|webp|bmp)$/i.test(url)) {
      return ResourceType.IMAGE;
    }
    
    // Article detection (common article domains)
    if (lowerUrl.includes('medium.com') ||
        lowerUrl.includes('dev.to') ||
        lowerUrl.includes('stackoverflow.com') ||
        lowerUrl.includes('github.com') ||
        lowerUrl.includes('wikipedia.org')) {
      return ResourceType.ARTICLE;
    }
    
    // Default to link
    return ResourceType.LINK;
  }
}

/**
 * User Factory with role-specific creation methods
 */
export class UserFactory {
  /**
   * Creates an admin user
   */
  public static createAdmin(data: {
    name: string;
    email: string;
    id?: string;
  }): User {
    return EntityFactory.createUser({
      ...data,
      role: UserRole.ADMIN
    });
  }

  /**
   * Creates an editor user
   */
  public static createEditor(data: {
    name: string;
    email: string;
    id?: string;
  }): User {
    return EntityFactory.createUser({
      ...data,
      role: UserRole.EDITOR
    });
  }

  /**
   * Creates a viewer user
   */
  public static createViewer(data: {
    name: string;
    email: string;
    id?: string;
  }): User {
    return EntityFactory.createUser({
      ...data,
      role: UserRole.VIEWER
    });
  }
}
