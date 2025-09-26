import { Topic } from '../../../models/Topic';
import { ResourceType } from '../../../types';

describe('Topic Model', () => {
  describe('Constructor and Basic Properties', () => {
    it('should create a topic with required properties', () => {
      const topic = new Topic('Test Topic', 'Test content');
      
      expect(topic.name).toBe('Test Topic');
      expect(topic.content).toBe('Test content');
      expect(topic.version).toBe(1);
      expect(topic.isCurrentVersion).toBe(true);
      expect(topic.id).toBeValidUUID();
      expect(topic).toHaveValidTimestamps();
    });

    it('should create a topic with parent ID', () => {
      const parentId = 'parent-id-123';
      const topic = new Topic('Child Topic', 'Child content', parentId);
      
      expect(topic.parentTopicId).toBe(parentId);
    });

    it('should create a topic with custom ID and version', () => {
      const customId = 'custom-id-123';
      const topic = new Topic('Test Topic', 'Test content', undefined, customId, 5);
      
      expect(topic.id).toBe(customId);
      expect(topic.version).toBe(5);
    });
  });

  describe('Validation', () => {
    it('should validate a valid topic', () => {
      const topic = new Topic('Valid Topic', 'Valid content');
      expect(topic.validate()).toBe(true);
    });

    it('should fail validation for empty name', () => {
      const topic = new Topic('', 'Valid content');
      expect(topic.validate()).toBe(false);
    });

    it('should fail validation for empty content', () => {
      const topic = new Topic('Valid Topic', '');
      expect(topic.validate()).toBe(false);
    });

    it('should fail validation for whitespace-only name', () => {
      const topic = new Topic('   ', 'Valid content');
      expect(topic.validate()).toBe(false);
    });

    it('should fail validation for version less than 1', () => {
      const topic = new Topic('Valid Topic', 'Valid content', undefined, undefined, 0);
      expect(topic.validate()).toBe(false);
    });
  });

  describe('Version Control', () => {
    it('should create a new version with incremented version number', () => {
      const originalTopic = new Topic('Original Topic', 'Original content');
      const newVersion = originalTopic.createNewVersion();
      
      expect(newVersion.version).toBe(2);
      expect(newVersion.originalId).toBe(originalTopic.id);
      expect(newVersion.isCurrentVersion).toBe(true);
      expect(originalTopic.isCurrentVersion).toBe(false);
      expect(newVersion.id).not.toBe(originalTopic.id);
    });

    it('should preserve original content in new version', () => {
      const originalTopic = new Topic('Original Topic', 'Original content');
      const newVersion = originalTopic.createNewVersion();
      
      expect(newVersion.name).toBe(originalTopic.name);
      expect(newVersion.content).toBe(originalTopic.content);
      expect(newVersion.parentTopicId).toBe(originalTopic.parentTopicId);
    });
  });

  describe('Composite Pattern - Hierarchy Management', () => {
    it('should add child topics', () => {
      const parentTopic = new Topic('Parent Topic', 'Parent content');
      const childTopic = new Topic('Child Topic', 'Child content');
      
      parentTopic.add(childTopic);
      
      expect(parentTopic.hasChildren()).toBe(true);
      expect(parentTopic.getChildren()).toHaveLength(1);
      expect(parentTopic.getChild(childTopic.id)).toBe(childTopic);
      expect(childTopic.getParent()).toBe(parentTopic);
      expect(childTopic.parentTopicId).toBe(parentTopic.id);
    });

    it('should remove child topics', () => {
      const parentTopic = new Topic('Parent Topic', 'Parent content');
      const childTopic = new Topic('Child Topic', 'Child content');
      
      parentTopic.add(childTopic);
      parentTopic.remove(childTopic);
      
      expect(parentTopic.hasChildren()).toBe(false);
      expect(parentTopic.getChildren()).toHaveLength(0);
      expect(childTopic.getParent()).toBeNull();
      expect(childTopic.parentTopicId).toBeUndefined();
    });

    it('should handle multiple children', () => {
      const parentTopic = new Topic('Parent Topic', 'Parent content');
      const child1 = new Topic('Child 1', 'Child 1 content');
      const child2 = new Topic('Child 2', 'Child 2 content');
      
      parentTopic.add(child1);
      parentTopic.add(child2);
      
      expect(parentTopic.getChildren()).toHaveLength(2);
      expect(parentTopic.getChild(child1.id)).toBe(child1);
      expect(parentTopic.getChild(child2.id)).toBe(child2);
    });
  });

  describe('Resource Management', () => {
    it('should add resources', () => {
      const topic = new Topic('Test Topic', 'Test content');
      const resource = {
        id: 'resource-1',
        topicId: topic.id,
        url: 'https://example.com',
        description: 'Test resource',
        type: ResourceType.ARTICLE,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      topic.addResource(resource);
      
      expect(topic.getResources()).toHaveLength(1);
      expect(topic.getResources()[0]).toBe(resource);
    });

    it('should remove resources', () => {
      const topic = new Topic('Test Topic', 'Test content');
      const resource = {
        id: 'resource-1',
        topicId: topic.id,
        url: 'https://example.com',
        description: 'Test resource',
        type: ResourceType.ARTICLE,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      topic.addResource(resource);
      topic.removeResource(resource.id);
      
      expect(topic.getResources()).toHaveLength(0);
    });
  });

  describe('Update Methods', () => {
    it('should update content and name', () => {
      const topic = new Topic('Original Topic', 'Original content');
      const originalUpdatedAt = topic.updatedAt;
      
      // Wait a bit to ensure timestamp changes
      setTimeout(() => {
        topic.updateContent('Updated Topic', 'Updated content');
        
        expect(topic.name).toBe('Updated Topic');
        expect(topic.content).toBe('Updated content');
        expect(topic.updatedAt).not.toBe(originalUpdatedAt);
      }, 10);
    });

    it('should update only name when content is undefined', () => {
      const topic = new Topic('Original Topic', 'Original content');
      
      topic.updateContent('Updated Topic');
      
      expect(topic.name).toBe('Updated Topic');
      expect(topic.content).toBe('Original content');
    });

    it('should update only content when name is undefined', () => {
      const topic = new Topic('Original Topic', 'Original content');
      
      topic.updateContent(undefined, 'Updated content');
      
      expect(topic.name).toBe('Original Topic');
      expect(topic.content).toBe('Updated content');
    });
  });

  describe('Utility Methods', () => {
    it('should calculate depth correctly', () => {
      const grandparent = new Topic('Grandparent', 'Grandparent content');
      const parent = new Topic('Parent', 'Parent content');
      const child = new Topic('Child', 'Child content');
      
      grandparent.add(parent);
      parent.add(child);
      
      expect(grandparent.getDepth()).toBe(0);
      expect(parent.getDepth()).toBe(1);
      expect(child.getDepth()).toBe(2);
    });

    it('should get path correctly', () => {
      const grandparent = new Topic('Grandparent', 'Grandparent content');
      const parent = new Topic('Parent', 'Parent content');
      const child = new Topic('Child', 'Child content');
      
      grandparent.add(parent);
      parent.add(child);
      
      expect(child.getPath()).toEqual(['Grandparent', 'Parent', 'Child']);
      expect(parent.getPath()).toEqual(['Grandparent', 'Parent']);
      expect(grandparent.getPath()).toEqual(['Grandparent']);
    });

    it('should get all descendants', () => {
      const parent = new Topic('Parent', 'Parent content');
      const child1 = new Topic('Child 1', 'Child 1 content');
      const child2 = new Topic('Child 2', 'Child 2 content');
      const grandchild = new Topic('Grandchild', 'Grandchild content');
      
      parent.add(child1);
      parent.add(child2);
      child1.add(grandchild);
      
      const descendants = parent.getAllDescendants();
      expect(descendants).toHaveLength(3);
      expect(descendants).toContain(child1);
      expect(descendants).toContain(child2);
      expect(descendants).toContain(grandchild);
    });
  });

  describe('Serialization', () => {
    it('should convert to JSON correctly', () => {
      const topic = new Topic('Test Topic', 'Test content', 'parent-id');
      const json = topic.toJSON();
      
      expect(json).toEqual({
        id: topic.id,
        name: 'Test Topic',
        content: 'Test content',
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
        version: 1,
        parentTopicId: 'parent-id'
      });
    });

    it('should create from JSON correctly', () => {
      const jsonData = {
        id: 'test-id',
        name: 'Test Topic',
        content: 'Test content',
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-02'),
        version: 2,
        parentTopicId: 'parent-id'
      };
      
      const topic = Topic.fromJSON(jsonData);
      
      expect(topic.id).toBe('test-id');
      expect(topic.name).toBe('Test Topic');
      expect(topic.content).toBe('Test content');
      expect(topic.version).toBe(2);
      expect(topic.parentTopicId).toBe('parent-id');
      expect(topic.createdAt).toBeInstanceOf(Date);
      expect(topic.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('Operation Method', () => {
    it('should call operation on topic and all children', () => {
      const parent = new Topic('Parent', 'Parent content');
      const child1 = new Topic('Child 1', 'Child 1 content');
      const child2 = new Topic('Child 2', 'Child 2 content');
      
      parent.add(child1);
      parent.add(child2);
      
      const parentSpy = jest.spyOn(parent, 'updateTimestamp' as any);
      const child1Spy = jest.spyOn(child1, 'operation');
      const child2Spy = jest.spyOn(child2, 'operation');
      
      parent.operation();
      
      expect(parentSpy).toHaveBeenCalled();
      expect(child1Spy).toHaveBeenCalled();
      expect(child2Spy).toHaveBeenCalled();
    });
  });
});
