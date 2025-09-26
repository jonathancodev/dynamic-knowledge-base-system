import { ITopicData, PathNode, ShortestPath } from '../types';

/**
 * Custom implementation of shortest path algorithm for topic hierarchy
 * Uses a modified Dijkstra's algorithm without external graph libraries
 */
export class TopicPathFinder {
  private topics: Map<string, ITopicData>;
  private adjacencyList: Map<string, Set<string>>;

  constructor(topics: ITopicData[]) {
    this.topics = new Map();
    this.adjacencyList = new Map();
    this.buildGraph(topics);
  }

  /**
   * Builds the graph representation from topic data
   */
  private buildGraph(topics: ITopicData[]): void {
    // Initialize maps
    for (const topic of topics) {
      this.topics.set(topic.id, topic);
      this.adjacencyList.set(topic.id, new Set());
    }

    // Build bidirectional adjacency list
    for (const topic of topics) {
      if (topic.parentTopicId && this.topics.has(topic.parentTopicId)) {
        // Add edge from parent to child
        this.adjacencyList.get(topic.parentTopicId)?.add(topic.id);
        // Add edge from child to parent (bidirectional)
        this.adjacencyList.get(topic.id)?.add(topic.parentTopicId);
      }
    }
  }

  /**
   * Finds the shortest path between two topics using custom Dijkstra implementation
   */
  public findShortestPath(startId: string, endId: string): ShortestPath | null {
    if (!this.topics.has(startId) || !this.topics.has(endId)) {
      return null;
    }

    if (startId === endId) {
      return {
        path: [startId],
        distance: 0,
        topics: [this.topics.get(startId)!]
      };
    }

    // Initialize distances and previous nodes
    const distances = new Map<string, number>();
    const previous = new Map<string, string | null>();
    const visited = new Set<string>();
    const unvisited = new Set<string>();

    // Initialize all distances to infinity except start
    for (const topicId of this.topics.keys()) {
      distances.set(topicId, topicId === startId ? 0 : Infinity);
      previous.set(topicId, null);
      unvisited.add(topicId);
    }

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentNode: string | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const distance = distances.get(nodeId)!;
        if (distance < minDistance) {
          minDistance = distance;
          currentNode = nodeId;
        }
      }

      if (currentNode === null || minDistance === Infinity) {
        break; // No path exists
      }

      unvisited.delete(currentNode);
      visited.add(currentNode);

      // If we reached the end node, we can stop
      if (currentNode === endId) {
        break;
      }

      // Update distances to neighbors
      const neighbors = this.adjacencyList.get(currentNode) || new Set();
      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) {
          continue;
        }

        const currentDistance = distances.get(currentNode)!;
        const edgeWeight = this.getEdgeWeight(currentNode, neighborId);
        const newDistance = currentDistance + edgeWeight;

        if (newDistance < distances.get(neighborId)!) {
          distances.set(neighborId, newDistance);
          previous.set(neighborId, currentNode);
        }
      }
    }

    // Reconstruct path
    const path = this.reconstructPath(previous, startId, endId);
    if (path.length === 0) {
      return null; // No path found
    }

    const distance = distances.get(endId)!;
    const topics = path.map(id => this.topics.get(id)!);

    return {
      path,
      distance,
      topics
    };
  }

  /**
   * Calculates the weight of an edge between two topics
   * Can be customized based on business logic
   */
  private getEdgeWeight(fromId: string, toId: string): number {
    const fromTopic = this.topics.get(fromId)!;
    const toTopic = this.topics.get(toId)!;

    // Base weight
    let weight = 1;

    // Add weight based on topic hierarchy (parent-child relationships)
    if (fromTopic.parentTopicId === toId || toTopic.parentTopicId === fromId) {
      weight = 1; // Direct parent-child relationship
    }

    // Add weight based on topic content similarity (simplified)
    const contentSimilarity = this.calculateContentSimilarity(fromTopic, toTopic);
    weight += (1 - contentSimilarity) * 0.5; // Lower weight for more similar content

    return weight;
  }

  /**
   * Simple content similarity calculation based on common words
   */
  private calculateContentSimilarity(topic1: ITopicData, topic2: ITopicData): number {
    const words1 = this.extractWords(topic1.name + ' ' + topic1.content);
    const words2 = this.extractWords(topic2.name + ' ' + topic2.content);

    if (words1.size === 0 || words2.size === 0) {
      return 0;
    }

    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size; // Jaccard similarity
  }

  /**
   * Extracts meaningful words from text
   */
  private extractWords(text: string): Set<string> {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should']);
    
    return new Set(
      text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word))
    );
  }

  /**
   * Reconstructs the path from the previous nodes map
   */
  private reconstructPath(
    previous: Map<string, string | null>,
    startId: string,
    endId: string
  ): string[] {
    const path: string[] = [];
    let currentId: string | null = endId;

    while (currentId !== null) {
      path.unshift(currentId);
      if (currentId === startId) {
        break;
      }
      currentId = previous.get(currentId) || null;
    }

    // If path doesn't start with startId, no path was found
    if (path.length === 0 || path[0] !== startId) {
      return [];
    }

    return path;
  }

  /**
   * Finds all paths between two topics (up to a maximum depth)
   */
  public findAllPaths(
    startId: string,
    endId: string,
    maxDepth: number = 10
  ): ShortestPath[] {
    if (!this.topics.has(startId) || !this.topics.has(endId)) {
      return [];
    }

    const allPaths: string[][] = [];
    const currentPath: string[] = [];
    const visited = new Set<string>();

    this.dfsAllPaths(startId, endId, currentPath, visited, allPaths, maxDepth);

    return allPaths.map(path => ({
      path,
      distance: this.calculatePathDistance(path),
      topics: path.map(id => this.topics.get(id)!)
    })).sort((a, b) => a.distance - b.distance);
  }

  /**
   * Depth-first search to find all paths
   */
  private dfsAllPaths(
    currentId: string,
    endId: string,
    currentPath: string[],
    visited: Set<string>,
    allPaths: string[][],
    maxDepth: number
  ): void {
    if (currentPath.length > maxDepth) {
      return;
    }

    currentPath.push(currentId);
    visited.add(currentId);

    if (currentId === endId) {
      allPaths.push([...currentPath]);
    } else {
      const neighbors = this.adjacencyList.get(currentId) || new Set();
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          this.dfsAllPaths(neighborId, endId, currentPath, visited, allPaths, maxDepth);
        }
      }
    }

    currentPath.pop();
    visited.delete(currentId);
  }

  /**
   * Calculates the total distance of a path
   */
  private calculatePathDistance(path: string[]): number {
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalDistance += this.getEdgeWeight(path[i]!, path[i + 1]!);
    }
    return totalDistance;
  }

  /**
   * Finds the closest common ancestor of two topics
   */
  public findClosestCommonAncestor(topicId1: string, topicId2: string): string | null {
    if (!this.topics.has(topicId1) || !this.topics.has(topicId2)) {
      return null;
    }

    const ancestors1 = this.getAncestors(topicId1);
    const ancestors2 = this.getAncestors(topicId2);

    // Find common ancestors
    const commonAncestors = ancestors1.filter(ancestor => ancestors2.includes(ancestor));
    
    if (commonAncestors.length === 0) {
      return null;
    }

    // Return the closest common ancestor (the one with the maximum depth)
    let closestAncestor = commonAncestors[0];
    let maxDepth = this.getTopicDepth(closestAncestor!);

    for (const ancestor of commonAncestors) {
      const depth = this.getTopicDepth(ancestor);
      if (depth > maxDepth) {
        maxDepth = depth;
        closestAncestor = ancestor;
      }
    }

    return closestAncestor ?? null;
  }

  /**
   * Gets all ancestors of a topic
   */
  private getAncestors(topicId: string): string[] {
    const ancestors: string[] = [];
    let currentId: string | undefined = topicId;

    while (currentId) {
      ancestors.push(currentId);
      const topic = this.topics.get(currentId);
      currentId = topic?.parentTopicId;
    }

    return ancestors;
  }

  /**
   * Calculates the depth of a topic in the hierarchy
   */
  private getTopicDepth(topicId: string): number {
    let depth = 0;
    let currentId: string | undefined = topicId;

    while (currentId) {
      const topic = this.topics.get(currentId);
      if (!topic?.parentTopicId) {
        break;
      }
      depth++;
      currentId = topic.parentTopicId;
    }

    return depth;
  }

  /**
   * Finds topics within a certain distance from a given topic
   */
  public findTopicsWithinDistance(topicId: string, maxDistance: number): PathNode[] {
    if (!this.topics.has(topicId)) {
      return [];
    }

    const distances = new Map<string, number>();
    const queue: PathNode[] = [{ topicId, distance: 0 }];
    const visited = new Set<string>();

    distances.set(topicId, 0);

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (visited.has(current.topicId)) {
        continue;
      }

      visited.add(current.topicId);

      if (current.distance >= maxDistance) {
        continue;
      }

      const neighbors = this.adjacencyList.get(current.topicId) || new Set();
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          const newDistance = current.distance + this.getEdgeWeight(current.topicId, neighborId);
          
          if (newDistance <= maxDistance && (!distances.has(neighborId) || newDistance < distances.get(neighborId)!)) {
            distances.set(neighborId, newDistance);
            queue.push({
              topicId: neighborId,
              distance: newDistance,
              parent: current.topicId
            });
          }
        }
      }
    }

    return Array.from(distances.entries())
      .map(([id, distance]) => ({ topicId: id, distance }))
      .filter(node => node.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Updates the graph when topics are added or modified
   */
  public updateGraph(topics: ITopicData[]): void {
    this.topics.clear();
    this.adjacencyList.clear();
    this.buildGraph(topics);
  }

  /**
   * Gets graph statistics
   */
  public getGraphStats(): {
    nodeCount: number;
    edgeCount: number;
    maxDepth: number;
    rootNodes: string[];
  } {
    const edgeCount = Array.from(this.adjacencyList.values())
      .reduce((sum, neighbors) => sum + neighbors.size, 0) / 2; // Divide by 2 for undirected graph

    const rootNodes = Array.from(this.topics.values())
      .filter(topic => !topic.parentTopicId)
      .map(topic => topic.id);

    const maxDepth = Math.max(
      ...Array.from(this.topics.keys()).map(id => this.getTopicDepth(id))
    );

    return {
      nodeCount: this.topics.size,
      edgeCount,
      maxDepth,
      rootNodes
    };
  }
}
