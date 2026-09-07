/**
 * TradeOS AI Review & Conversation Repository
 * 
 * Manages persistent storage and retrieval of AI generated reviews, coaching logs,
 * grounded metrics snapshots, and tagged notes.
 */

import { LocalDatabase } from './localDatabase';
import { StoredAIReview, AICoachMessage } from '../types/ai';

const COLLECTION_REVIEWS = 'ai_reviews';
const COLLECTION_CHAT_HISTORY = 'ai_chat_history';

export class AIReviewRepository {
  /**
   * Retrieves all stored AI reviews for a user
   */
  async getReviews(userId: string, accountId?: string): Promise<StoredAIReview[]> {
    const reviews = LocalDatabase.getItems<StoredAIReview>(userId, COLLECTION_REVIEWS);
    let filtered = reviews;
    if (accountId && accountId !== 'ALL') {
      filtered = reviews.filter((r) => !r.accountId || r.accountId === accountId);
    }
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Retrieves a single AI review by ID
   */
  async getReviewById(userId: string, reviewId: string): Promise<StoredAIReview | null> {
    return LocalDatabase.getItemById<StoredAIReview>(userId, COLLECTION_REVIEWS, reviewId);
  }

  /**
   * Saves or updates an AI review
   */
  async saveReview(userId: string, review: Omit<StoredAIReview, 'id' | 'createdAt'> & { id?: string }): Promise<StoredAIReview> {
    const record: StoredAIReview = {
      ...review,
      id: review.id || `AIR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      userId,
      createdAt: new Date().toISOString(),
      isFavorite: review.isFavorite ?? false,
      tags: review.tags || [],
    };
    LocalDatabase.insertItem<StoredAIReview>(userId, COLLECTION_REVIEWS, record);
    return record;
  }

  /**
   * Deletes an AI review
   */
  async deleteReview(userId: string, reviewId: string): Promise<boolean> {
    return LocalDatabase.deleteItem(userId, COLLECTION_REVIEWS, reviewId);
  }

  /**
   * Toggles favorite status on a stored review
   */
  async toggleFavorite(userId: string, reviewId: string): Promise<StoredAIReview | null> {
    const review = await this.getReviewById(userId, reviewId);
    if (!review) return null;
    const updated = await this.saveReview(userId, {
      ...review,
      isFavorite: !review.isFavorite,
    });
    return updated;
  }

  /**
   * Retrieves conversation chat history for AI Coach
   */
  async getChatHistory(userId: string): Promise<AICoachMessage[]> {
    return LocalDatabase.getItems<AICoachMessage>(userId, COLLECTION_CHAT_HISTORY);
  }

  /**
   * Saves updated chat history
   */
  async saveChatHistory(userId: string, messages: AICoachMessage[]): Promise<void> {
    LocalDatabase.saveItems<AICoachMessage>(userId, COLLECTION_CHAT_HISTORY, messages);
  }

  /**
   * Clears chat history
   */
  async clearChatHistory(userId: string): Promise<void> {
    LocalDatabase.saveItems<AICoachMessage>(userId, COLLECTION_CHAT_HISTORY, []);
  }
}
