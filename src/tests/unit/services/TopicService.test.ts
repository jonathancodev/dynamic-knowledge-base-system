import { TopicService } from '../../../services/TopicService';
import { DatabaseManager } from '../../../database/DatabaseManager';
import { CreateTopicRequest, UpdateTopicRequest } from '../../../types';

describe('TopicService', () => {
  let topicService: TopicService;
  let dbManager: DatabaseManager;

  beforeEach(() => {
    dbManager = DatabaseManager.getInstance();
    topicService = new TopicService(dbManager);
  });

  describe('createTopic', () => {
    it('should create a topic successfully', async () => {
      const request: CreateTopicRequest = {
        name: 'Test Topic',
        content: 'Test content'
      };

      const topic = await topicService.createTopic(request, 'user-1');

      expect(topic.name).toBe('Test Topic');
      expect(topic.content).toBe('Test content');
      expect(topic.version).toBe(1);
      expect(topic.id).toBeValidUUID();
      expect(topic).toHaveValidTimestamps();
    });

    it('should create a topic with parent', async () => {
      // First create a parent topic
      const parentRequest: CreateTopicRequest = {
        name: 'Parent Topic',
        content: 'Parent content'
      };
      const parentTopic = await topicService.createTopic(parentRequest, 'user-1');

      // Then create a child topic
      const childRequest: CreateTopicRequest = {
        name: 'Child Topic',
        content: 'Child content',
        parentTopicId: parentTopic.id
      };
      const childTopic = await topicService.createTopic(childRequest, 'user-1');

      expect(childTopic.parentTopicId).toBe(parentTopic.id);
    });

    it('should throw error for non-existent parent', async () => {
      const request: CreateTopicRequest = {
        name: 'Test Topic',
        content: 'Test content',
        parentTopicId: 'non-existent-id'
      };

      await expect(topicService.createTopic(request, 'user-1'))
        .rejects
        .toThrow('Parent topic with ID non-existent-id not found');
    });

    it('should throw validation error for invalid data', async () => {
      const request: CreateTopicRequest = {
        name: '',
        content: 'Test content'
      };

      await expect(topicService.createTopic(request, 'user-1'))
        .rejects
        .toThrow('Invalid topic data');
    });
  });

  describe('getTopicById', () => {
    it('should retrieve a topic by ID', async () => {
      const request: CreateTopicRequest = {
        name: 'Test Topic',
        content: 'Test content'
      };
      const createdTopic = await topicService.createTopic(request, 'user-1');

      const retrievedTopic = await topicService.getTopicById(createdTopic.id);

      expect(retrievedTopic).toBeDefined();
      expect(retrievedTopic!.id).toBe(createdTopic.id);
      expect(retrievedTopic!.name).toBe('Test Topic');
    });

    it('should return null for non-existent topic', async () => {
      const topic = await topicService.getTopicById('non-existent-id');
      expect(topic).toBeNull();
    });

    it('should include children when requested', async () => {
      // Create parent and child topics
      const parentRequest: CreateTopicRequest = {
        name: 'Parent Topic',
        content: 'Parent content'
      };
      const parentTopic = await topicService.createTopic(parentRequest, 'user-1');

      const childRequest: CreateTopicRequest = {
        name: 'Child Topic',
        content: 'Child content',
        parentTopicId: parentTopic.id
      };
      await topicService.createTopic(childRequest, 'user-1');

      const retrievedTopic = await topicService.getTopicById(parentTopic.id, {
        includeChildren: true
      });

      expect(retrievedTopic).toBeDefined();
      expect(retrievedTopic!.children).toHaveLength(1);
      expect(retrievedTopic!.children[0]!.name).toBe('Child Topic');
    });
  });

  describe('updateTopic', () => {
    it('should update a topic and create new version', async () => {
      const request: CreateTopicRequest = {
        name: 'Original Topic',
        content: 'Original content'
      };
      const originalTopic = await topicService.createTopic(request, 'user-1');

      const updateRequest: UpdateTopicRequest = {
        name: 'Updated Topic',
        content: 'Updated content'
      };
      const updatedTopic = await topicService.updateTopic(originalTopic.id, updateRequest, 'user-1');

      expect(updatedTopic.name).toBe('Updated Topic');
      expect(updatedTopic.content).toBe('Updated content');
      expect(updatedTopic.version).toBe(2);
      expect(updatedTopic.id).toBe(originalTopic.id); // Same ID
    });

    it('should throw error for non-existent topic', async () => {
      const updateRequest: UpdateTopicRequest = {
        name: 'Updated Topic'
      };

      await expect(topicService.updateTopic('non-existent-id', updateRequest, 'user-1'))
        .rejects
        .toThrow('Topic with ID non-existent-id not found');
    });

    it('should validate parent topic when changing parent', async () => {
      const topic = await topicService.createTopic({
        name: 'Test Topic',
        content: 'Test content'
      }, 'user-1');

      const updateRequest: UpdateTopicRequest = {
        parentTopicId: 'non-existent-parent'
      };

      await expect(topicService.updateTopic(topic.id, updateRequest, 'user-1'))
        .rejects
        .toThrow('Parent topic with ID non-existent-parent not found');
    });

    it('should prevent circular references', async () => {
      // Create parent and child
      const parent = await topicService.createTopic({
        name: 'Parent',
        content: 'Parent content'
      }, 'user-1');

      const child = await topicService.createTopic({
        name: 'Child',
        content: 'Child content',
        parentTopicId: parent.id
      }, 'user-1');

      // Try to make parent a child of child (circular reference)
      const updateRequest: UpdateTopicRequest = {
        parentTopicId: child.id
      };

      await expect(topicService.updateTopic(parent.id, updateRequest, 'user-1'))
        .rejects
        .toThrow('Cannot set parent: would create circular reference');
    });
  });

  describe('deleteTopic', () => {
    it('should delete a topic successfully', async () => {
      const topic = await topicService.createTopic({
        name: 'Test Topic',
        content: 'Test content'
      }, 'user-1');

      const deleted = await topicService.deleteTopic(topic.id, 'user-1');
      expect(deleted).toBe(true);

      // Verify topic is deleted
      const retrievedTopic = await topicService.getTopicById(topic.id);
      expect(retrievedTopic).toBeNull();
    });

    it('should return false for non-existent topic', async () => {
      const deleted = await topicService.deleteTopic('non-existent-id', 'user-1');
      expect(deleted).toBe(false);
    });

    it('should throw error when deleting topic with children', async () => {
      // Create parent and child
      const parent = await topicService.createTopic({
        name: 'Parent',
        content: 'Parent content'
      }, 'user-1');

      await topicService.createTopic({
        name: 'Child',
        content: 'Child content',
        parentTopicId: parent.id
      }, 'user-1');

      await expect(topicService.deleteTopic(parent.id, 'user-1'))
        .rejects
        .toThrow('Cannot delete topic with children');
    });
  });

  describe('getTopicVersions', () => {
    it('should return all versions of a topic', async () => {
      const topic = await topicService.createTopic({
        name: 'Original Topic',
        content: 'Original content'
      }, 'user-1');

      // Update to create version 2
      await topicService.updateTopic(topic.id, {
        name: 'Updated Topic'
      }, 'user-1');

      // Update to create version 3
      await topicService.updateTopic(topic.id, {
        content: 'Updated content'
      }, 'user-1');

      const versions = await topicService.getTopicVersions(topic.id);
      expect(versions).toHaveLength(3);
      expect(versions[0]!.version).toBe(3); // Latest first
      expect(versions[1]!.version).toBe(2);
      expect(versions[2]!.version).toBe(1);
    });
  });

  describe('revertToVersion', () => {
    it('should revert topic to previous version', async () => {
      const topic = await topicService.createTopic({
        name: 'Original Topic',
        content: 'Original content'
      }, 'user-1');

      // Update topic
      await topicService.updateTopic(topic.id, {
        name: 'Updated Topic',
        content: 'Updated content'
      }, 'user-1');

      // Revert to version 1
      const revertedTopic = await topicService.revertToVersion(topic.id, 1, 'user-1');

      expect(revertedTopic.name).toBe('Original Topic');
      expect(revertedTopic.content).toBe('Original content');
      expect(revertedTopic.version).toBe(3); // New version created
    });

    it('should throw error for non-existent version', async () => {
      const topic = await topicService.createTopic({
        name: 'Test Topic',
        content: 'Test content'
      }, 'user-1');

      await expect(topicService.revertToVersion(topic.id, 999, 'user-1'))
        .rejects
        .toThrow('Version 999 not found for topic');
    });
  });

  describe('getTopicHierarchy', () => {
    it('should return complete hierarchy', async () => {
      // Create parent
      const parent = await topicService.createTopic({
        name: 'Parent',
        content: 'Parent content'
      }, 'user-1');

      // Create children
      const child1 = await topicService.createTopic({
        name: 'Child 1',
        content: 'Child 1 content',
        parentTopicId: parent.id
      }, 'user-1');

      await topicService.createTopic({
        name: 'Child 2',
        content: 'Child 2 content',
        parentTopicId: parent.id
      }, 'user-1');

      // Create grandchild
      await topicService.createTopic({
        name: 'Grandchild',
        content: 'Grandchild content',
        parentTopicId: child1.id
      }, 'user-1');

      const hierarchy = await topicService.getTopicHierarchy(parent.id);

      expect(hierarchy).toBeDefined();
      expect(hierarchy!.name).toBe('Parent');
      expect(hierarchy!.children).toHaveLength(2);
      expect(hierarchy!.children[0]!.children).toHaveLength(1); // Child 1 has grandchild
      expect(hierarchy!.children[1]!.children).toHaveLength(0); // Child 2 has no children
    });
  });

  describe('getRootTopics', () => {
    it('should return only root topics', async () => {
      // Create root topics
      await topicService.createTopic({
        name: 'Root 1',
        content: 'Root 1 content'
      }, 'user-1');

      const root2 = await topicService.createTopic({
        name: 'Root 2',
        content: 'Root 2 content'
      }, 'user-1');

      // Create child topic
      await topicService.createTopic({
        name: 'Child',
        content: 'Child content',
        parentTopicId: root2.id
      }, 'user-1');

      const rootTopics = await topicService.getRootTopics();

      expect(rootTopics).toHaveLength(2);
      expect(rootTopics.every(topic => !topic.parentTopicId)).toBe(true);
    });
  });

  describe('searchTopics', () => {
    it('should search topics by name', async () => {
      await topicService.createTopic({
        name: 'JavaScript Basics',
        content: 'Introduction to JavaScript'
      }, 'user-1');

      await topicService.createTopic({
        name: 'Python Basics',
        content: 'Introduction to Python'
      }, 'user-1');

      const results = await topicService.searchTopics('JavaScript');

      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe('JavaScript Basics');
    });

    it('should search topics by content', async () => {
      await topicService.createTopic({
        name: 'Programming',
        content: 'JavaScript fundamentals'
      }, 'user-1');

      await topicService.createTopic({
        name: 'Web Development',
        content: 'HTML and CSS basics'
      }, 'user-1');

      const results = await topicService.searchTopics('JavaScript');

      expect(results).toHaveLength(1);
      expect(results[0]!.name).toBe('Programming');
    });
  });

  describe('moveTopic', () => {
    it('should move topic to new parent', async () => {
      const parent1 = await topicService.createTopic({
        name: 'Parent 1',
        content: 'Parent 1 content'
      }, 'user-1');

      const parent2 = await topicService.createTopic({
        name: 'Parent 2',
        content: 'Parent 2 content'
      }, 'user-1');

      const child = await topicService.createTopic({
        name: 'Child',
        content: 'Child content',
        parentTopicId: parent1.id
      }, 'user-1');

      const movedTopic = await topicService.moveTopic(child.id, parent2.id, 'user-1');

      expect(movedTopic.parentTopicId).toBe(parent2.id);
    });

  });

  describe('getTopicStats', () => {
    it('should return correct statistics', async () => {
      // Create root topic
      const root = await topicService.createTopic({
        name: 'Root',
        content: 'Root content'
      }, 'user-1');

      // Create child topics
      await topicService.createTopic({
        name: 'Child 1',
        content: 'Child 1 content',
        parentTopicId: root.id
      }, 'user-1');

      await topicService.createTopic({
        name: 'Child 2',
        content: 'Child 2 content',
        parentTopicId: root.id
      }, 'user-1');

      // Update root topic to create versions
      await topicService.updateTopic(root.id, {
        name: 'Updated Root'
      }, 'user-1');

      const stats = await topicService.getTopicStats();

      expect(stats.totalTopics).toBe(3);
      expect(stats.totalVersions).toBe(4); // 3 initial + 1 update
      expect(stats.rootTopics).toBe(1);
      expect(stats.maxDepth).toBe(1); // Root -> Child
      expect(stats.avgChildrenPerTopic).toBeCloseTo(0.67, 2); // 2 children / 3 topics
    });
  });
});
