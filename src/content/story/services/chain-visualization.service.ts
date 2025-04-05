import { Inject, Injectable } from '@nestjs/common';
import { Story } from '../entities/story.entity';
import {
  STORY_REPOSITORY,
  StoryRepository,
} from '../repositories/story.repository';
import { StoryErrorFactory } from '../entities/errors';
import {
  ChainVisualizationDto,
  StoryNodePositionDto,
} from '../presentation/dto';

@Injectable()
export class ChainVisualizationService {
  // Spacing constants for layout algorithm
  private readonly HORIZONTAL_SPACING = 1; // Will be multiplied for final coordinates
  private readonly VERTICAL_SPACING = 1; // Will be multiplied for final coordinates

  constructor(
    @Inject(STORY_REPOSITORY)
    private readonly storyRepository: StoryRepository,
  ) {}

  /**
   * Generate visualization data for a story chain
   */
  async visualizeChain(rootId: string): Promise<ChainVisualizationDto> {
    // First, validate that the root story exists
    const rootStory = await this.storyRepository.findById(rootId);
    if (!rootStory) {
      throw StoryErrorFactory.storyNotFound(rootId);
    }

    // Verify this is actually a root story
    if (rootStory.rootId !== rootId) {
      throw StoryErrorFactory.notChainRoot(rootId);
    }

    // Get all stories in the chain
    const chainStories = await this.storyRepository.findByRootId(rootId);

    // Create the tree structure for traversal
    const treeMap = new Map<string, { story: Story; children: string[] }>();

    // Initialize the map with all stories
    chainStories.forEach((story) => {
      treeMap.set(story.id, { story, children: [] });
    });

    // Build parent-child relationships
    chainStories.forEach((story) => {
      if (story.parentId) {
        const parent = treeMap.get(story.parentId);
        if (parent) {
          parent.children.push(story.id);
        }
      }
    });

    // Calculate positions using a modified Reingold-Tilford algorithm
    const positionNodes: StoryNodePositionDto[] = [];
    const nodesByLevel: Record<number, StoryNodePositionDto[]> = {};
    const connections: Array<{ source: string; target: string }> = [];

    // First, assign levels (y-coordinates based on depth)
    this.assignLevels(
      rootId,
      treeMap,
      positionNodes,
      nodesByLevel,
      connections,
      0,
    );

    // Then assign horizontal positions for each level
    this.assignHorizontalPositions(nodesByLevel);

    // Calculate actual coordinates with spacing
    this.calculateFinalCoordinates(positionNodes);

    // Calculate visualization dimensions
    const width = Math.max(...positionNodes.map((node) => node.x)) + 1;
    const height = Math.max(...positionNodes.map((node) => node.level)) + 1;

    return {
      nodes: positionNodes,
      rootId,
      width,
      height,
      connections,
    };
  }

  /**
   * Assign levels (y-coordinates) and build the initial position nodes
   * Uses depth-first traversal
   */
  private assignLevels(
    nodeId: string,
    treeMap: Map<string, { story: Story; children: string[] }>,
    positionNodes: StoryNodePositionDto[],
    nodesByLevel: Record<number, StoryNodePositionDto[]>,
    connections: Array<{ source: string; target: string }>,
    level: number,
  ): void {
    const node = treeMap.get(nodeId);
    if (!node) return;

    // Create the position node
    const positionNode: StoryNodePositionDto = {
      id: nodeId,
      x: 0, // Will be calculated later
      y: level,
      level,
      index: 0, // Will be calculated later
      parentId: node.story.parentId,
      childrenIds: [...node.children],
    };

    positionNodes.push(positionNode);

    // Initialize the level array if not exists
    if (!nodesByLevel[level]) {
      // Create a new array rather than modifying the parameter
      // eslint-disable-next-line no-param-reassign
      nodesByLevel[level] = [];
    }

    // Add to the level array and set its initial index
    const indexInLevel = nodesByLevel[level].length;
    positionNode.index = indexInLevel;
    nodesByLevel[level].push(positionNode);

    // Add connections for this node's children
    node.children.forEach((childId) => {
      connections.push({ source: nodeId, target: childId });
    });

    // Recursively assign levels to children
    node.children.forEach((childId) => {
      this.assignLevels(
        childId,
        treeMap,
        positionNodes,
        nodesByLevel,
        connections,
        level + 1,
      );
    });
  }

  /**
   * Assign horizontal positions for each level
   * This ensures nodes are spaced evenly within their level
   */
  private assignHorizontalPositions(
    nodesByLevel: Record<number, StoryNodePositionDto[]>,
  ): void {
    // Process each level
    Object.keys(nodesByLevel).forEach((levelKey) => {
      const level = parseInt(levelKey, 10);
      const nodesInLevel = nodesByLevel[level];

      // Simple approach: space nodes evenly
      nodesInLevel.forEach((node, index) => {
        // Create a new node with updated properties rather than modifying directly
        const updatedNode = { ...node };
        updatedNode.index = index;
        updatedNode.x = index; // Initial x is just the index, will be adjusted with spacing later

        // Apply changes back to the original node
        Object.assign(node, updatedNode);
      });
    });
  }

  /**
   * Calculate final coordinates with proper spacing
   */
  private calculateFinalCoordinates(nodes: StoryNodePositionDto[]): void {
    nodes.forEach((node) => {
      // Create a new node with updated properties rather than modifying directly
      const updatedNode = { ...node };
      updatedNode.x *= this.HORIZONTAL_SPACING;
      updatedNode.y = updatedNode.level * this.VERTICAL_SPACING;

      // Apply changes back to the original node
      Object.assign(node, updatedNode);
    });
  }
}
