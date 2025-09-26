// Base types and enums
/// <reference path="./express.d.ts" />

export enum UserRole {
  ADMIN = 'Admin',
  EDITOR = 'Editor',
  VIEWER = 'Viewer'
}

export enum ResourceType {
  VIDEO = 'video',
  ARTICLE = 'article',
  PDF = 'pdf',
  LINK = 'link',
  IMAGE = 'image'
}

export enum Permission {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete'
}

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Topic interfaces
export interface ITopicData extends Record<string, unknown> {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  parentTopicId?: string;
}

export interface ITopicVersion extends ITopicData {
  originalTopicId: string;
  isCurrentVersion: boolean;
}

export interface ITopicHierarchy extends ITopicData {
  children: ITopicHierarchy[];
  resources: IResourceData[];
}

// Resource interfaces
export interface IResourceData extends Record<string, unknown> {
  id: string;
  topicId: string;
  url: string;
  description: string;
  type: ResourceType;
  createdAt: Date;
  updatedAt: Date;
}

// User interfaces
export interface IUserData extends Record<string, unknown> {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  passwordHash?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Path finding types
export interface PathNode {
  topicId: string;
  distance: number;
  parent?: string;
}

export interface ShortestPath {
  path: string[];
  distance: number;
  topics: ITopicData[];
}

// Validation schemas
export interface CreateTopicRequest {
  name: string;
  content: string;
  parentTopicId?: string;
}

export interface UpdateTopicRequest {
  name?: string;
  content?: string;
  parentTopicId?: string | null;
}

export interface CreateResourceRequest {
  topicId: string;
  url: string;
  description: string;
  type: ResourceType;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
}

// Database query options
export interface QueryOptions {
  includeChildren?: boolean;
  includeResources?: boolean;
  version?: number;
  limit?: number;
  offset?: number;
}
