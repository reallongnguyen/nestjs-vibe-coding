/**
 * Types for Gorse sync events
 */

export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export interface UserSyncPayload {
  userId: string;
  labels: string[];
  subscribe?: string[];
  timestamp: number;
  operation: SyncOperation;
}

export interface ItemSyncPayload {
  itemId: string;
  labels: string[];
  categories?: string[];
  timestamp: number;
  isHidden?: boolean;
  operation: SyncOperation;
}

export interface FeedbackSyncPayload {
  feedbackType: string;
  userId: string;
  itemId: string;
  timestamp: number;
  comment?: string;
}

export interface SyncMetadata {
  source: string;
  reason?: string;
  batchId?: string;
}
