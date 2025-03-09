/**
 * Gorse API response interfaces
 */
export interface GorseUser {
  UserId: string;
  Labels: string[];
  Subscribe?: string[];
  Comment?: string;
}

export interface GorseItem {
  ItemId: string;
  Labels: string[];
  Categories?: string[];
  Timestamp: string;
  Comment?: string;
  IsHidden?: boolean;
}

export interface GorseFeedback {
  FeedbackType: string;
  UserId: string;
  ItemId: string;
  Timestamp: string;
  Comment?: string;
}

export interface GorseRecommendation {
  Id: string;
  Score: number;
}

export interface GorseHealthStatus {
  CacheStoreConnected: boolean;
  CacheStoreError?: string;
  DataStoreConnected: boolean;
  DataStoreError?: string;
  Ready: boolean;
}

export interface GorseUsersResponse {
  Cursor: string;
  Users: GorseUser[];
}

/**
 * Interface for Gorse client
 */
export interface IGorseClient {
  // User Management
  insertUser(
    userId: string,
    labels: string[],
    subscribe?: string[],
  ): Promise<void>;
  getUser(userId: string): Promise<GorseUser>;
  updateUser(
    userId: string,
    labels?: string[],
    subscribe?: string[],
  ): Promise<void>;
  deleteUser(userId: string): Promise<void>;
  listUsers(n?: number, cursor?: string): Promise<GorseUsersResponse>;

  // Item Management
  insertItem(
    itemId: string,
    timestamp: Date,
    labels: string[],
    categories?: string[],
    isHidden?: boolean,
  ): Promise<void>;
  getItem(itemId: string): Promise<GorseItem>;
  updateItem(
    itemId: string,
    labels?: string[],
    categories?: string[],
    isHidden?: boolean,
  ): Promise<void>;
  deleteItem(itemId: string): Promise<void>;

  // Feedback Management
  insertFeedback(feedback: GorseFeedback): Promise<void>;

  // Recommendation APIs
  getRecommend(
    userId: string,
    writeBackType: string | undefined,
    writeBackDelay: string | undefined,
    n?: number,
    offset?: number,
  ): Promise<string[]>;
  getRecommendByCategory(
    userId: string,
    category: string,
    writeBackType: string | undefined,
    writeBackDelay: string | undefined,
    n?: number,
    offset?: number,
  ): Promise<string[]>;
  getPopular(
    userId: string | undefined,
    n?: number,
    offset?: number,
  ): Promise<GorseRecommendation[]>;
  getPopularByCategory(
    category: string,
    userId: string | undefined,
    n?: number,
    offset?: number,
  ): Promise<GorseRecommendation[]>;
  getLatest(n?: number): Promise<string[]>;
  getSimilar(itemId: string, n?: number): Promise<GorseRecommendation[]>;
  getUserNeighbors(
    userId: string,
    n?: number,
    offset?: number,
  ): Promise<GorseRecommendation[]>;

  // Health Check APIs
  getLiveness(): Promise<GorseHealthStatus>;
  getReadiness(): Promise<GorseHealthStatus>;
}
