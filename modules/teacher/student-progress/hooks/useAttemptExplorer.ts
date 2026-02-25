'use client';

import * as React from 'react';
import type { AttemptDetailDTO, AttemptExplorerFilter, AttemptRowDTO } from '@/types';
import { getApiErrorMessage } from '@/utils/http';

export function useAttemptExplorer(baseUrl: string) {
  const [attempts, setAttempts] = React.useState<AttemptRowDTO[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [filter, setFilter] = React.useState<AttemptExplorerFilter>('ALL');
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [selectedAttemptId, setSelectedAttemptId] = React.useState<number | null>(null);
  const [attemptDetail, setAttemptDetail] = React.useState<AttemptDetailDTO | null>(null);

  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [showIncorrectOnly, setShowIncorrectOnly] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function loadFirstPage() {
      setLoading(true);

      try {
        const res = await fetch(`${baseUrl}/attempts?filter=${filter}`, { cache: 'no-store' });
        const payload: unknown = await res.json().catch(() => null);
        if (cancelled) return;

        if (!res.ok) {
          setAttempts([]);
          setNextCursor(null);
          setSelectedAttemptId(null);
          setAttemptDetail(null);
          setShowIncorrectOnly(false);
          setDetailError(getApiErrorMessage(payload, 'Failed to load attempts'));
          return;
        }

        const rows = (payload as { rows?: unknown })?.rows;
        const next = (payload as { nextCursor?: unknown })?.nextCursor;

        setAttempts(Array.isArray(rows) ? (rows as AttemptRowDTO[]) : []);
        setNextCursor(typeof next === 'string' ? next : null);

        setSelectedAttemptId(null);
        setAttemptDetail(null);
        setShowIncorrectOnly(false);
        setDetailError(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFirstPage();
    return () => {
      cancelled = true;
    };
  }, [baseUrl, filter]);

  React.useEffect(() => {
    if (!selectedAttemptId) {
      setAttemptDetail(null);
      setShowIncorrectOnly(false);
      setDetailError(null);
      setDetailLoading(false);
    }
  }, [selectedAttemptId]);

  async function loadMore() {
    if (!nextCursor) return;

    setLoadingMore(true);
    try {
      const res = await fetch(`${baseUrl}/attempts?filter=${filter}&cursor=${nextCursor}`, {
        cache: 'no-store',
      });
      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) return;

      const rows = (payload as { rows?: unknown })?.rows;
      const next = (payload as { nextCursor?: unknown })?.nextCursor;

      const newRows = Array.isArray(rows) ? (rows as AttemptRowDTO[]) : [];
      const newCursor = typeof next === 'string' ? next : null;

      setAttempts((prev) => [...prev, ...newRows]);
      setNextCursor(newCursor);
    } finally {
      setLoadingMore(false);
    }
  }

  async function openDetail(attemptId: number) {
    setSelectedAttemptId(attemptId);
    setAttemptDetail(null);
    setShowIncorrectOnly(false);
    setDetailError(null);

    setDetailLoading(true);
    try {
      const res = await fetch(`${baseUrl}/attempts/${attemptId}`, { cache: 'no-store' });
      const payload: unknown = await res.json().catch(() => null);

      if (!res.ok) {
        setAttemptDetail(null);
        setDetailError(getApiErrorMessage(payload, 'Failed to load attempt details'));
        return;
      }

      setAttemptDetail(payload as AttemptDetailDTO);
    } finally {
      setDetailLoading(false);
    }
  }

  return {
    attempts,
    loading,
    filter,
    setFilter,

    nextCursor,
    loadingMore,
    loadMore,

    selectedAttemptId,
    setSelectedAttemptId,

    attemptDetail,
    openDetail,

    detailLoading,
    detailError,

    showIncorrectOnly,
    setShowIncorrectOnly,
  } as const;
}
