import { TopicPathFinder } from '../../../algorithms/ShortestPathAlgorithm';
import { ITopicData } from '../../../types';

describe('TopicPathFinder', () => {
  let pathFinder: TopicPathFinder;
  let sampleTopics: ITopicData[];

  beforeEach(() => {
    // Create a sample topic hierarchy for testing
    sampleTopics = [
      {
        id: 'root',
        name: 'Root Topic',
        content: 'Root content',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'child1',
        name: 'Child 1',
        content: 'Child 1 content',
        version: 1,
        parentTopicId: 'root',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'child2',
        name: 'Child 2',
        content: 'Child 2 content',
        version: 1,
        parentTopicId: 'root',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'grandchild1',
        name: 'Grandchild 1',
        content: 'Grandchild 1 content',
        version: 1,
        parentTopicId: 'child1',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'grandchild2',
        name: 'Grandchild 2',
        content: 'Grandchild 2 content',
        version: 1,
        parentTopicId: 'child2',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    pathFinder = new TopicPathFinder(sampleTopics);
  });

  describe('findShortestPath', () => {
    it('should find path between parent and child', () => {
      const path = pathFinder.findShortestPath('root', 'child1');

      expect(path).toBeDefined();
      expect(path!.path).toEqual(['root', 'child1']);
      expect(path!.distance).toBeCloseTo(1.375, 2);
      expect(path!.topics).toHaveLength(2);
    });

    it('should find path between siblings', () => {
      const path = pathFinder.findShortestPath('child1', 'child2');

      expect(path).toBeDefined();
      expect(path!.path).toEqual(['child1', 'root', 'child2']);
      expect(path!.distance).toBeCloseTo(2.75, 2);
      expect(path!.topics).toHaveLength(3);
    });

    it('should find path between grandparent and grandchild', () => {
      const path = pathFinder.findShortestPath('root', 'grandchild1');

      expect(path).toBeDefined();
      expect(path!.path).toEqual(['root', 'child1', 'grandchild1']);
      expect(path!.distance).toBeCloseTo(2.71, 2);
      expect(path!.topics).toHaveLength(3);
    });

    it('should find path between cousins', () => {
      const path = pathFinder.findShortestPath('grandchild1', 'grandchild2');

      expect(path).toBeDefined();
      expect(path!.path).toEqual(['grandchild1', 'child1', 'root', 'child2', 'grandchild2']);
      expect(path!.distance).toBeCloseTo(5.42, 2);
      expect(path!.topics).toHaveLength(5);
    });

    it('should return same topic path for identical start and end', () => {
      const path = pathFinder.findShortestPath('root', 'root');

      expect(path).toBeDefined();
      expect(path!.path).toEqual(['root']);
      expect(path!.distance).toBe(0);
      expect(path!.topics).toHaveLength(1);
    });

    it('should return null for non-existent topics', () => {
      const path = pathFinder.findShortestPath('root', 'non-existent');
      expect(path).toBeNull();

      const path2 = pathFinder.findShortestPath('non-existent', 'root');
      expect(path2).toBeNull();
    });

    it('should handle disconnected graphs', () => {
      // Add a disconnected topic
      const disconnectedTopics = [
        ...sampleTopics,
        {
          id: 'isolated',
          name: 'Isolated Topic',
          content: 'Isolated content',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const disconnectedPathFinder = new TopicPathFinder(disconnectedTopics);
      const path = disconnectedPathFinder.findShortestPath('root', 'isolated');

      expect(path).toBeNull();
    });
  });

  describe('findAllPaths', () => {
    it('should find all paths between two topics', () => {
      const paths = pathFinder.findAllPaths('grandchild1', 'grandchild2', 10);

      expect(paths.length).toBeGreaterThan(0);
      expect(paths[0]!.path).toEqual(['grandchild1', 'child1', 'root', 'child2', 'grandchild2']);
      
      // Paths should be sorted by distance
      for (let i = 0; i < paths.length - 1; i++) {
        expect(paths[i]!.distance).toBeLessThanOrEqual(paths[i + 1]!.distance);
      }
    });

    it('should respect max depth limit', () => {
      const paths = pathFinder.findAllPaths('grandchild1', 'grandchild2', 2);

      // Should not find any paths since shortest path is 4 hops
      expect(paths).toHaveLength(0);
    });
  });

  describe('findClosestCommonAncestor', () => {
    it('should find closest common ancestor for siblings', () => {
      const ancestor = pathFinder.findClosestCommonAncestor('child1', 'child2');
      expect(ancestor).toBe('root');
    });

    it('should find closest common ancestor for cousins', () => {
      const ancestor = pathFinder.findClosestCommonAncestor('grandchild1', 'grandchild2');
      expect(ancestor).toBe('root');
    });

    it('should find closest common ancestor for parent-child', () => {
      const ancestor = pathFinder.findClosestCommonAncestor('root', 'child1');
      expect(ancestor).toBe('root');
    });

    it('should return null for non-existent topics', () => {
      const ancestor = pathFinder.findClosestCommonAncestor('root', 'non-existent');
      expect(ancestor).toBeNull();
    });

    it('should handle same topic', () => {
      const ancestor = pathFinder.findClosestCommonAncestor('root', 'root');
      expect(ancestor).toBe('root');
    });
  });

  describe('findTopicsWithinDistance', () => {
    it('should find topics within specified distance', () => {
      const nearbyTopics = pathFinder.findTopicsWithinDistance('root', 1.5);

      expect(nearbyTopics).toHaveLength(3); // root itself + 2 children
      expect(nearbyTopics.map(t => t.topicId)).toContain('root');
      expect(nearbyTopics.map(t => t.topicId)).toContain('child1');
      expect(nearbyTopics.map(t => t.topicId)).toContain('child2');
    });

    it('should find topics within larger distance', () => {
      const nearbyTopics = pathFinder.findTopicsWithinDistance('root', 3);

      expect(nearbyTopics).toHaveLength(5); // All topics in the hierarchy
      expect(nearbyTopics.map(t => t.topicId)).toContain('grandchild1');
      expect(nearbyTopics.map(t => t.topicId)).toContain('grandchild2');
    });

    it('should return empty array for non-existent topic', () => {
      const nearbyTopics = pathFinder.findTopicsWithinDistance('non-existent', 1);
      expect(nearbyTopics).toHaveLength(0);
    });

    it('should sort results by distance', () => {
      const nearbyTopics = pathFinder.findTopicsWithinDistance('root', 2);

      // Should be sorted by distance
      for (let i = 0; i < nearbyTopics.length - 1; i++) {
        expect(nearbyTopics[i]!.distance).toBeLessThanOrEqual(nearbyTopics[i + 1]!.distance);
      }
    });
  });

  describe('updateGraph', () => {
    it('should update graph with new topics', () => {
      const newTopics = [
        ...sampleTopics,
        {
          id: 'new-topic',
          name: 'New Topic',
          content: 'New content',
          version: 1,
          parentTopicId: 'root',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      pathFinder.updateGraph(newTopics);

      const path = pathFinder.findShortestPath('root', 'new-topic');
      expect(path).toBeDefined();
      expect(path!.path).toEqual(['root', 'new-topic']);
    });
  });

  describe('getGraphStats', () => {
    it('should return correct graph statistics', () => {
      const stats = pathFinder.getGraphStats();

      expect(stats.nodeCount).toBe(5);
      expect(stats.edgeCount).toBe(4); // 4 parent-child relationships (bidirectional)
      expect(stats.rootNodes).toEqual(['root']);
      expect(stats.maxDepth).toBe(2); // root -> child -> grandchild
    });
  });

  describe('content similarity', () => {
    it('should consider content similarity in path weights', () => {
      const topicsWithSimilarContent: ITopicData[] = [
        {
          id: 'topic1',
          name: 'JavaScript Basics',
          content: 'Introduction to JavaScript programming language',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'topic2',
          name: 'JavaScript Advanced',
          content: 'Advanced JavaScript programming concepts',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'topic3',
          name: 'Python Basics',
          content: 'Introduction to Python programming language',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Create connections: topic1 -> topic2 -> topic3
      topicsWithSimilarContent[1]!.parentTopicId = 'topic1';
      topicsWithSimilarContent[2]!.parentTopicId = 'topic2';

      const similarityPathFinder = new TopicPathFinder(topicsWithSimilarContent);
      const path = similarityPathFinder.findShortestPath('topic1', 'topic3');

      expect(path).toBeDefined();
      expect(path!.path).toEqual(['topic1', 'topic2', 'topic3']);
      
      // Distance should be affected by content similarity
      expect(path!.distance).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle empty topic list', () => {
      const emptyPathFinder = new TopicPathFinder([]);
      const path = emptyPathFinder.findShortestPath('topic1', 'topic2');
      expect(path).toBeNull();
    });

    it('should handle single topic', () => {
      const singleTopic: ITopicData = {
        id: 'single',
        name: 'Single Topic',
        content: 'Single content',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const singlePathFinder = new TopicPathFinder([singleTopic]);
      const path = singlePathFinder.findShortestPath('single', 'single');

      expect(path).toBeDefined();
      expect(path!.path).toEqual(['single']);
      expect(path!.distance).toBe(0);
    });

    it('should handle circular references gracefully', () => {
      const circularTopics: ITopicData[] = [
        {
          id: 'topic1',
          name: 'Topic 1',
          content: 'Content 1',
          version: 1,
          parentTopicId: 'topic2',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'topic2',
          name: 'Topic 2',
          content: 'Content 2',
          version: 1,
          parentTopicId: 'topic1',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      // Should not crash with circular reference
      expect(() => new TopicPathFinder(circularTopics)).not.toThrow();
    });
  });
});
