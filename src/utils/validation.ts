import Joi from 'joi';
import { UserRole, ResourceType } from '../types';
import { ValidationError } from './errors';

/**
 * Validation schemas using Joi
 */

// Topic validation schemas
export const topicSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(200).required()
      .messages({
        'string.empty': 'Topic name is required',
        'string.min': 'Topic name must not be empty',
        'string.max': 'Topic name must not exceed 200 characters'
      }),
    content: Joi.string().trim().min(1).max(10000).required()
      .messages({
        'string.empty': 'Topic content is required',
        'string.min': 'Topic content must not be empty',
        'string.max': 'Topic content must not exceed 10000 characters'
      }),
    parentTopicId: Joi.string().uuid().optional().allow(null)
      .messages({
        'string.guid': 'Parent topic ID must be a valid UUID'
      })
  }),

  update: Joi.object({
    name: Joi.string().trim().min(1).max(200).optional()
      .messages({
        'string.min': 'Topic name must not be empty',
        'string.max': 'Topic name must not exceed 200 characters'
      }),
    content: Joi.string().trim().min(1).max(10000).optional()
      .messages({
        'string.min': 'Topic content must not be empty',
        'string.max': 'Topic content must not exceed 10000 characters'
      }),
    parentTopicId: Joi.string().uuid().optional().allow(null)
      .messages({
        'string.guid': 'Parent topic ID must be a valid UUID'
      })
  }),

  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Topic ID must be a valid UUID',
      'any.required': 'Topic ID is required'
    }),

  version: Joi.number().integer().min(1).required()
    .messages({
      'number.base': 'Version must be a number',
      'number.integer': 'Version must be an integer',
      'number.min': 'Version must be at least 1'
    })
};

// Resource validation schemas
export const resourceSchemas = {
  create: Joi.object({
    topicId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Topic ID must be a valid UUID',
        'any.required': 'Topic ID is required'
      }),
    url: Joi.string().uri().required()
      .messages({
        'string.uri': 'URL must be a valid URI',
        'any.required': 'URL is required'
      }),
    description: Joi.string().trim().min(1).max(500).required()
      .messages({
        'string.empty': 'Description is required',
        'string.min': 'Description must not be empty',
        'string.max': 'Description must not exceed 500 characters'
      }),
    type: Joi.string().valid(...Object.values(ResourceType)).required()
      .messages({
        'any.only': `Type must be one of: ${Object.values(ResourceType).join(', ')}`,
        'any.required': 'Resource type is required'
      })
  }),

  update: Joi.object({
    url: Joi.string().uri().optional()
      .messages({
        'string.uri': 'URL must be a valid URI'
      }),
    description: Joi.string().trim().min(1).max(500).optional()
      .messages({
        'string.min': 'Description must not be empty',
        'string.max': 'Description must not exceed 500 characters'
      }),
    type: Joi.string().valid(...Object.values(ResourceType)).optional()
      .messages({
        'any.only': `Type must be one of: ${Object.values(ResourceType).join(', ')}`
      })
  }),

  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'Resource ID must be a valid UUID',
      'any.required': 'Resource ID is required'
    })
};

// User validation schemas
export const userSchemas = {
  create: Joi.object({
    name: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must not be empty',
        'string.max': 'Name must not exceed 100 characters'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required'
      }),
    role: Joi.string().valid(...Object.values(UserRole)).required()
      .messages({
        'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`,
        'any.required': 'User role is required'
      })
  }),

  update: Joi.object({
    name: Joi.string().trim().min(1).max(100).optional()
      .messages({
        'string.min': 'Name must not be empty',
        'string.max': 'Name must not exceed 100 characters'
      }),
    email: Joi.string().email().optional()
      .messages({
        'string.email': 'Email must be a valid email address'
      }),
    role: Joi.string().valid(...Object.values(UserRole)).optional()
      .messages({
        'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`
      })
  }),

  id: Joi.string().uuid().required()
    .messages({
      'string.guid': 'User ID must be a valid UUID',
      'any.required': 'User ID is required'
    }),

  register: Joi.object({
    name: Joi.string().trim().min(1).max(100).required()
      .messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must not be empty',
        'string.max': 'Name must not exceed 100 characters'
      }),
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().min(6).required()
      .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required'
      }),
    role: Joi.string().valid(...Object.values(UserRole)).optional().default(UserRole.VIEWER)
      .messages({
        'any.only': `Role must be one of: ${Object.values(UserRole).join(', ')}`
      })
  }),

  login: Joi.object({
    email: Joi.string().email().required()
      .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required'
      })
  })
};

// Query parameters validation
export const querySchemas = {
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).optional().default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit must not exceed 100'
      }),
    offset: Joi.number().integer().min(0).optional().default(0)
      .messages({
        'number.base': 'Offset must be a number',
        'number.integer': 'Offset must be an integer',
        'number.min': 'Offset must be at least 0'
      })
  }),

  search: Joi.object({
    q: Joi.string().trim().min(1).max(200).required()
      .messages({
        'string.empty': 'Search query is required',
        'string.min': 'Search query must not be empty',
        'string.max': 'Search query must not exceed 200 characters'
      })
  }),

  topicHierarchy: Joi.object({
    includeChildren: Joi.boolean().optional().default(false),
    includeResources: Joi.boolean().optional().default(false),
    maxDepth: Joi.number().integer().min(1).max(10).optional().default(5)
      .messages({
        'number.base': 'Max depth must be a number',
        'number.integer': 'Max depth must be an integer',
        'number.min': 'Max depth must be at least 1',
        'number.max': 'Max depth must not exceed 10'
      })
  })
};

// Path finding validation
export const pathSchemas = {
  findPath: Joi.object({
    startId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'Start topic ID must be a valid UUID',
        'any.required': 'Start topic ID is required'
      }),
    endId: Joi.string().uuid().required()
      .messages({
        'string.guid': 'End topic ID must be a valid UUID',
        'any.required': 'End topic ID is required'
      })
  })
};

/**
 * Validation utility class
 */
export class Validator {
  /**
   * Validates data against a Joi schema
   */
  public static validate<T>(
    schema: Joi.ObjectSchema,
    data: unknown,
    options?: Joi.ValidationOptions
  ): T {
    const defaultOptions: Joi.ValidationOptions = {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    };

    const { error, value } = schema.validate(data, { ...defaultOptions, ...options });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join('; ');
      throw new ValidationError(errorMessage);
    }

    return value as T;
  }

  /**
   * Validates topic creation data
   */
  public static validateTopicCreate(data: unknown): {
    name: string;
    content: string;
    parentTopicId?: string;
  } {
    return this.validate(topicSchemas.create, data);
  }

  /**
   * Validates topic update data
   */
  public static validateTopicUpdate(data: unknown): {
    name?: string;
    content?: string;
    parentTopicId?: string;
  } {
    return this.validate(topicSchemas.update, data);
  }

  /**
   * Validates resource creation data
   */
  public static validateResourceCreate(data: unknown): {
    topicId: string;
    url: string;
    description: string;
    type: ResourceType;
  } {
    return this.validate(resourceSchemas.create, data);
  }

  /**
   * Validates resource update data
   */
  public static validateResourceUpdate(data: unknown): {
    url?: string;
    description?: string;
    type?: ResourceType;
  } {
    return this.validate(resourceSchemas.update, data);
  }

  /**
   * Validates user creation data
   */
  public static validateUserCreate(data: unknown): {
    name: string;
    email: string;
    role: UserRole;
  } {
    return this.validate(userSchemas.create, data);
  }

  /**
   * Validates user update data
   */
  public static validateUserUpdate(data: unknown): {
    name?: string;
    email?: string;
    role?: UserRole;
  } {
    return this.validate(userSchemas.update, data);
  }

  /**
   * Validates user registration data
   */
  public static validateUserRegister(data: unknown): {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
  } {
    return this.validate(userSchemas.register, data);
  }

  /**
   * Validates user login data
   */
  public static validateUserLogin(data: unknown): {
    email: string;
    password: string;
  } {
    return this.validate(userSchemas.login, data);
  }

  /**
   * Validates UUID format
   */
  public static validateId(id: string, fieldName: string = 'ID'): string {
    const schema = Joi.string().uuid().required()
      .messages({
        'string.guid': `${fieldName} must be a valid UUID`,
        'any.required': `${fieldName} is required`
      });

    const { error, value } = schema.validate(id);
    if (error) {
      throw new ValidationError(error.details.map(detail => detail.message).join('; '));
    }
    return value as string;
  }

  /**
   * Validates pagination parameters
   */
  public static validatePagination(data: unknown): {
    limit: number;
    offset: number;
  } {
    return this.validate(querySchemas.pagination, data);
  }

  /**
   * Validates search parameters
   */
  public static validateSearch(data: unknown): {
    q: string;
  } {
    return this.validate(querySchemas.search, data);
  }

  /**
   * Validates path finding parameters
   */
  public static validatePathFinding(data: unknown): {
    startId: string;
    endId: string;
  } {
    return this.validate(pathSchemas.findPath, data);
  }

  /**
   * Validates topic hierarchy query parameters
   */
  public static validateTopicHierarchyQuery(data: unknown): {
    includeChildren: boolean;
    includeResources: boolean;
    maxDepth: number;
  } {
    return this.validate(querySchemas.topicHierarchy, data);
  }
}

/**
 * Custom validation functions
 */
export class CustomValidators {
  /**
   * Validates that a URL is accessible (simplified check)
   */
  public static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates email format using regex
   */
  public static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validates that a string contains only alphanumeric characters and spaces
   */
  public static isAlphanumericWithSpaces(str: string): boolean {
    const regex = /^[a-zA-Z0-9\s]+$/;
    return regex.test(str);
  }

  /**
   * Validates that a string doesn't contain potentially harmful content
   */
  public static isSafeContent(content: string): boolean {
    // Basic check for potentially harmful patterns
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi
    ];

    return !dangerousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Validates that a topic name doesn't contain reserved words
   */
  public static isValidTopicName(name: string): boolean {
    const reservedWords = ['admin', 'api', 'system', 'root', 'null', 'undefined'];
    const lowerName = name.toLowerCase().trim();
    return !reservedWords.includes(lowerName);
  }

  /**
   * Validates password strength (if implementing authentication)
   */
  public static isStrongPassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
