import { AbstractBaseEntity } from './abstract/BaseEntity';
import { IResourceData, ResourceType } from '../types';

/**
 * Resource entity representing external links or documents
 * Associated with topics in the knowledge base
 */
export class Resource extends AbstractBaseEntity {
  public topicId: string;
  public url: string;
  public description: string;
  public type: ResourceType;

  constructor(
    topicId: string,
    url: string,
    description: string,
    type: ResourceType,
    id?: string
  ) {
    super(id);
    this.topicId = topicId;
    this.url = url;
    this.description = description;
    this.type = type;
  }

  // Update methods
  public updateResource(
    url?: string,
    description?: string,
    type?: ResourceType
  ): void {
    if (url !== undefined) {
      this.url = url;
    }
    if (description !== undefined) {
      this.description = description;
    }
    if (type !== undefined) {
      this.type = type;
    }
    this.updateTimestamp();
  }

  // Validation
  public validate(): boolean {
    return (
      this.topicId.trim().length > 0 &&
      this.url.trim().length > 0 &&
      this.description.trim().length > 0 &&
      this.isValidUrl(this.url) &&
      Object.values(ResourceType).includes(this.type)
    );
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Serialization
  public override toJSON(): IResourceData {
    return {
      id: this.id,
      topicId: this.topicId,
      url: this.url,
      description: this.description,
      type: this.type,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  public static override fromJSON(data: IResourceData): Resource {
    const resource = new Resource(
      data.topicId,
      data.url,
      data.description,
      data.type,
      data.id
    );
    // Note: createdAt and updatedAt are readonly, so we can't modify them directly
    return resource;
  }

  // Utility methods
  public getFileExtension(): string | null {
    try {
      const url = new URL(this.url);
      const pathname = url.pathname;
      const lastDot = pathname.lastIndexOf('.');
      return lastDot !== -1 ? pathname.substring(lastDot + 1).toLowerCase() : null;
    } catch {
      return null;
    }
  }

  public getDomain(): string | null {
    try {
      const url = new URL(this.url);
      return url.hostname;
    } catch {
      return null;
    }
  }

  public isImageResource(): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
    const extension = this.getFileExtension();
    return extension !== null && imageExtensions.includes(extension);
  }

  public isVideoResource(): boolean {
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'];
    const extension = this.getFileExtension();
    const isVideoUrl = this.url.includes('youtube.com') || 
                      this.url.includes('vimeo.com') ||
                      this.url.includes('dailymotion.com');
    return (extension !== null && videoExtensions.includes(extension)) || isVideoUrl;
  }

  public isPdfResource(): boolean {
    const extension = this.getFileExtension();
    return extension === 'pdf';
  }
}
