/**
 * useFeedback — submits user feedback on a fortune reading to Supabase.
 * Issue #16: AI Feedback Loop
 */
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export type FeedbackRating = 1 | -1;
export type FeedbackType = 'accurate' | 'too_vague' | 'not_me';

export interface UseFeedbackResult {
  submitting: boolean;
  submitted: boolean;
  submitFeedback: (
    readingId: string | null,
    rating: FeedbackRating,
    feedbackType: FeedbackType,
  ) => Promise<void>;
  reset: () => void;
}

export function useFeedback(): UseFeedbackResult {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { session } = useAuthStore();

  async function submitFeedback(
    readingId: string | null,
    rating: FeedbackRating,
    feedbackType: FeedbackType,
  ): Promise<void> {
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      await supabase.from('FortuneFeedback').insert({
        userId: session.user.id,
        fortuneId: readingId ?? null,
        rating,
        feedbackType,
      });
      setSubmitted(true);
    } catch (e) {
      console.error('[useFeedback] submit error:', e);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    submitting,
    submitted,
    submitFeedback,
    reset: () => setSubmitted(false),
  };
}
