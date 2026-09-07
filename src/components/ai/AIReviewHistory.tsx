/**
 * TradeOS Stored AI Review & Coaching Log Ledger
 * 
 * Manages persisted AI evaluation reports, enabling historical auditing,
 * search filtering, markdown/JSON exports, and review pinning.
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTradeOS } from '../../context/TradeOSContext';
import { AIService } from '../../services/aiService';
import { StoredAIReview } from '../../types/ai';
import { AIResponseCard } from './AIResponseCard';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  Sparkles,
  Search,
  Star,
  Trash2,
  Calendar,
  Eye,
  X,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const AIReviewHistory: React.FC = () => {
  const { currentUser } = useAuth();
  const { selectedAccountId } = useTradeOS();
  const { notify } = useNotification();

  const [reviews, setReviews] = useState<StoredAIReview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('ALL');
  const [activeReviewDetail, setActiveReviewDetail] = useState<StoredAIReview | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadReviews = async () => {
    setIsLoading(true);
    try {
      const data = await AIService.getStoredReviews(currentUser?.id || 'user-default', selectedAccountId);
      setReviews(data);
    } catch (err) {
      console.error('Failed to load review history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [currentUser?.id, selectedAccountId]);

  const handleToggleFavorite = async (reviewId: string) => {
    try {
      const updated = await AIService.toggleFavoriteReview(currentUser?.id || 'user-default', reviewId);
      if (updated) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, isFavorite: updated.isFavorite } : r))
        );
        notify.info(
          updated.isFavorite ? 'Review Pinned' : 'Review Unpinned',
          `Updated status for ${updated.title}.`
        );
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await AIService.deleteStoredReview(currentUser?.id || 'user-default', reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      if (activeReviewDetail?.id === reviewId) {
        setActiveReviewDetail(null);
      }
      notify.info('Review Deleted', 'The AI evaluation record has been removed.');
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedTypeFilter === 'ALL' || r.reviewType === selectedTypeFilter;

    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#121418] border border-[#22252A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 text-[#848B98] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search stored AI audits, prompts, tags..."
              className="w-full bg-[#181B20] border border-[#2A2E35] rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-[#848B98] focus:outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-[#181B20] border border-[#2A2E35] rounded-lg text-white font-medium focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Audit Types</option>
            <option value="TRADE_REVIEW">Trade Review</option>
            <option value="MISTAKE_ANALYSIS">Mistake Analysis</option>
            <option value="PATTERN_DISCOVERY">Pattern Discovery</option>
            <option value="DAILY_REVIEW">Daily Review</option>
            <option value="WEEKLY_REVIEW">Weekly Review</option>
            <option value="MONTHLY_REVIEW">Monthly Review</option>
            <option value="PSYCHOLOGY_REVIEW">Psychology Review</option>
            <option value="RISK_REVIEW">Risk Review</option>
            <option value="PERFORMANCE_COACHING">Performance Coaching</option>
            <option value="CUSTOM_INQUIRY">Coach Q&A</option>
          </select>
        </div>

        <div className="text-xs text-[#848B98] font-mono self-end sm:self-auto">
          {filteredReviews.length} {filteredReviews.length === 1 ? 'audit stored' : 'audits stored'}
        </div>
      </div>

      {/* Review Ledger List */}
      {filteredReviews.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#121418] border border-[#22252A] text-xs text-[#848B98]">
          <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2 opacity-50" />
          <span className="font-bold text-white block">No AI Review Records Found</span>
          <p className="mt-1">
            Run an AI audit in the Audit Studio or ask the AI Coach a question to store permanent evaluation logs.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((review) => (
            <div
              key={review.id}
              className="p-4 rounded-xl bg-[#121418] border border-[#22252A] space-y-3 hover:border-[#323742] transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFavorite(review.id)}
                    className="p-1 rounded hover:bg-[#181B20] text-[#848B98] hover:text-amber-400 transition-colors"
                  >
                    <Star
                      className={`h-4 w-4 ${
                        review.isFavorite ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>

                  <Badge variant="purple" className="text-[10px] font-mono">
                    {review.reviewType.replace(/_/g, ' ')}
                  </Badge>

                  <span className="text-sm font-bold text-white tracking-tight">
                    {review.title}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#848B98] font-mono self-end sm:self-auto">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{new Date(review.createdAt).toLocaleDateString()} {new Date(review.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveReviewDetail(activeReviewDetail?.id === review.id ? null : review)}
                    className="text-xs px-2.5 py-1 border-[#2A2E35] text-[#D1D5DB] hover:text-white"
                  >
                    {activeReviewDetail?.id === review.id ? (
                      <>
                        <X className="h-3.5 w-3.5 mr-1" />
                        Close
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        View Audit
                      </>
                    )}
                  </Button>

                  <button
                    onClick={() => handleDeleteReview(review.id)}
                    className="p-1.5 rounded hover:bg-rose-500/20 text-[#848B98] hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Prompt / Subtitle */}
              <div className="text-xs text-[#848B98] pl-7">
                <strong>Inquiry:</strong> {review.prompt}
              </div>

              {/* Snapshot metrics pills */}
              {review.groundedMetricsSnapshot && (
                <div className="flex flex-wrap gap-2 pl-7 pt-1">
                  <span className="px-2 py-0.5 rounded bg-[#181B20] border border-[#2A2E35] text-[10px] font-mono text-[#D1D5DB]">
                    Trades: {review.groundedMetricsSnapshot.tradeCount}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#181B20] border border-[#2A2E35] text-[10px] font-mono text-emerald-400">
                    WR: {review.groundedMetricsSnapshot.winRate.toFixed(1)}%
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#181B20] border border-[#2A2E35] text-[10px] font-mono text-cyan-400">
                    PF: {review.groundedMetricsSnapshot.profitFactor.toFixed(2)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-[#181B20] border border-[#2A2E35] text-[10px] font-mono text-[#848B98]">
                    Max DD: {review.groundedMetricsSnapshot.maxDrawdownPercent.toFixed(2)}%
                  </span>
                </div>
              )}

              {/* Expanded Card Details */}
              {activeReviewDetail?.id === review.id && (
                <div className="pt-3 border-t border-[#22252A]">
                  <AIResponseCard response={review.response} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
