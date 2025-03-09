import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import {
  GorseUser,
  GorseItem,
  GorseFeedback,
  GorseRecommendation,
  GorseHealthStatus,
  GorseUsersResponse,
  IGorseClient,
} from './interfaces/gorse.client.interface';

/**
 * Implementation of the Gorse client interface
 * Handles communication with the Gorse recommendation system
 */
@Injectable()
export class GorseClient implements IGorseClient {
  private readonly logger = new Logger(GorseClient.name);
  private readonly client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>('recommendation.gorse.url');
    const apiKey = this.configService.get<string>(
      'recommendation.gorse.apiKey',
    );

    if (!baseURL || !apiKey) {
      throw new Error('Missing required Gorse configuration');
    }

    this.client = axios.create({
      baseURL,
      headers: {
        'X-API-Key': apiKey,
      },
    });
  }

  // User Management
  async insertUser(
    userId: string,
    labels: string[],
    subscribe?: string[],
  ): Promise<void> {
    try {
      await this.client.post(`/api/user`, {
        UserId: userId,
        Labels: labels,
        Subscribe: subscribe,
      });
      this.logger.debug(`Inserted user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to insert user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async getUser(userId: string): Promise<GorseUser> {
    try {
      const response = await this.client.get(`/api/user/${userId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async updateUser(
    userId: string,
    labels?: string[],
    subscribe?: string[],
  ): Promise<void> {
    try {
      await this.client.patch(`/api/user/${userId}`, {
        Labels: labels,
        Subscribe: subscribe,
      });
      this.logger.debug(`Updated user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.client.delete(`/api/user/${userId}`);
      this.logger.debug(`Deleted user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to delete user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async listUsers(n?: number, cursor?: string): Promise<GorseUsersResponse> {
    try {
      const params = new URLSearchParams();
      if (n) params.append('n', n.toString());
      if (cursor) params.append('cursor', cursor);

      const response = await this.client.get(`/api/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to list users: ${error.message}`);
      throw error;
    }
  }

  // Item Management
  async insertItem(
    itemId: string,
    timestamp: Date,
    labels: string[],
    categories?: string[],
    isHidden?: boolean,
  ): Promise<void> {
    try {
      await this.client.post(`/api/item`, {
        ItemId: itemId,
        Labels: labels,
        Categories: categories || [],
        Timestamp: timestamp.toISOString(),
        IsHidden: isHidden,
      });
      this.logger.debug(`Inserted item ${itemId}`);
    } catch (error) {
      this.logger.error(`Failed to insert item ${itemId}: ${error.message}`);
      throw error;
    }
  }

  async getItem(itemId: string): Promise<GorseItem> {
    try {
      const response = await this.client.get(`/api/item/${itemId}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get item ${itemId}: ${error.message}`);
      throw error;
    }
  }

  async updateItem(
    itemId: string,
    labels?: string[],
    categories?: string[],
    isHidden?: boolean,
  ): Promise<void> {
    try {
      await this.client.patch(`/api/item/${itemId}`, {
        Labels: labels,
        Categories: categories,
        IsHidden: isHidden,
      });
      this.logger.debug(`Updated item ${itemId}`);
    } catch (error) {
      this.logger.error(`Failed to update item ${itemId}: ${error.message}`);
      throw error;
    }
  }

  async deleteItem(itemId: string): Promise<void> {
    try {
      await this.client.delete(`/api/item/${itemId}`);
      this.logger.debug(`Deleted item ${itemId}`);
    } catch (error) {
      this.logger.error(`Failed to delete item ${itemId}: ${error.message}`);
      throw error;
    }
  }

  // Feedback Management
  async insertFeedback(feedback: GorseFeedback): Promise<void> {
    try {
      await this.client.post('/api/feedback', feedback);
      this.logger.debug(
        `Inserted feedback for user ${feedback.UserId} on item ${feedback.ItemId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to insert feedback for user ${feedback.UserId} on item ${feedback.ItemId}: ${error.message}`,
      );
      throw error;
    }
  }

  // Recommendation APIs
  async getRecommend(
    userId: string,
    writeBackType: string | undefined,
    writeBackDelay: string | undefined,
    n: number = 10,
    offset: number = 0,
  ): Promise<string[]> {
    try {
      const params = new URLSearchParams({
        n: n.toString(),
        offset: offset.toString(),
      });
      if (writeBackType) params.append('write-back-type', writeBackType);
      if (writeBackDelay) params.append('write-back-delay', writeBackDelay);

      const response = await this.client.get(
        `/api/recommend/${userId}?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get recommendations for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  async getRecommendByCategory(
    userId: string,
    category: string,
    writeBackType: string | undefined,
    writeBackDelay: string | undefined,
    n: number = 10,
    offset: number = 0,
  ): Promise<string[]> {
    try {
      const params = new URLSearchParams({
        n: n.toString(),
        offset: offset.toString(),
      });
      if (writeBackType) params.append('write-back-type', writeBackType);
      if (writeBackDelay) params.append('write-back-delay', writeBackDelay);

      const response = await this.client.get(
        `/api/recommend/${userId}/${category}?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get recommendations for user ${userId} in category ${category}: ${error.message}`,
      );
      throw error;
    }
  }

  async getPopular(
    userId: string | undefined,
    n: number = 10,
    offset: number = 0,
  ): Promise<GorseRecommendation[]> {
    try {
      const params = new URLSearchParams({
        n: n.toString(),
        offset: offset.toString(),
      });
      if (userId) params.append('user-id', userId);

      const response = await this.client.get(
        `/api/popular?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get popular items: ${error.message}`);
      throw error;
    }
  }

  async getPopularByCategory(
    category: string,
    userId: string | undefined,
    n: number = 10,
    offset: number = 0,
  ): Promise<GorseRecommendation[]> {
    try {
      const params = new URLSearchParams({
        n: n.toString(),
        offset: offset.toString(),
      });
      if (userId) params.append('user-id', userId);

      const response = await this.client.get(
        `/api/popular/${category}?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get popular items in category ${category}: ${error.message}`,
      );
      throw error;
    }
  }

  async getLatest(n: number = 10): Promise<string[]> {
    try {
      const response = await this.client.get(`/api/latest/${n}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to get latest items: ${error.message}`);
      throw error;
    }
  }

  async getSimilar(
    itemId: string,
    n: number = 10,
  ): Promise<GorseRecommendation[]> {
    try {
      const response = await this.client.get(
        `/api/item/${itemId}/neighbors?n=${n}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get similar items for ${itemId}: ${error.message}`,
      );
      throw error;
    }
  }

  async getUserNeighbors(
    userId: string,
    n: number = 10,
    offset: number = 0,
  ): Promise<GorseRecommendation[]> {
    try {
      const params = new URLSearchParams({
        n: n.toString(),
        offset: offset.toString(),
      });

      const response = await this.client.get(
        `/api/user/${userId}/neighbors?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to get neighbors for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  // Health Check APIs
  async getLiveness(): Promise<GorseHealthStatus> {
    try {
      const response = await this.client.get('/api/health/live');
      return response.data;
    } catch (error) {
      this.logger.error(`Gorse liveness check failed: ${error.message}`);
      throw error;
    }
  }

  async getReadiness(): Promise<GorseHealthStatus> {
    try {
      const response = await this.client.get('/api/health/ready');
      return response.data;
    } catch (error) {
      this.logger.error(`Gorse readiness check failed: ${error.message}`);
      throw error;
    }
  }

  // Count APIs
  async getUserCount(): Promise<number> {
    const response = await this.client.get('/api/users/count');
    return response.data;
  }

  async getItemCount(): Promise<number> {
    const response = await this.client.get('/api/items/count');
    return response.data;
  }

  async getFeedbackCount(): Promise<number> {
    const response = await this.client.get('/api/feedback/count');
    return response.data;
  }
}
