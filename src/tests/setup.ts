import { DatabaseManager } from '../database/DatabaseManager';

/**
 * Test setup configuration
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Global test setup
beforeAll(async () => {
  // Initialize test database with different configuration
  const testDbManager = DatabaseManager.getInstance({
    dataDirectory: './test-data',
    autoSave: false, // Disable auto-save for tests
    saveInterval: 0
  });

  await testDbManager.initializeDatabase();
});

// Global test teardown
afterAll(async () => {
  const dbManager = DatabaseManager.getInstance();
  await dbManager.clearAll();
  await dbManager.closeAll();
  
  // Reset singleton instance for clean state
  DatabaseManager.resetInstance();
});

// Clean up before each test
beforeEach(async () => {
  const dbManager = DatabaseManager.getInstance();
  await dbManager.clearAll();
  
  // Reinitialize with default admin
  await dbManager.initializeDatabase();
});

// Extend Jest matchers for better testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toHaveValidTimestamps(): R;
    }
  }
}

// Custom Jest matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },

  toHaveValidTimestamps(received: any) {
    const hasCreatedAt = received.createdAt && !isNaN(new Date(received.createdAt).getTime());
    const hasUpdatedAt = received.updatedAt && !isNaN(new Date(received.updatedAt).getTime());
    const pass = hasCreatedAt && hasUpdatedAt;
    
    if (pass) {
      return {
        message: () => `expected object not to have valid timestamps`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected object to have valid createdAt and updatedAt timestamps`,
        pass: false,
      };
    }
  },
});

export {};
