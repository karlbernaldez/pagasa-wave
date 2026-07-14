import { Clock3, GitCompareArrows, MessageSquareText, UserRound } from 'lucide-react';

import { AnnotationDiffSummary } from '@/features/projects/components/review/AnnotationDiffSummary';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value) {
  if (!value) return '—';
