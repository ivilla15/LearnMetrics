'use client';

import * as React from 'react';
import type { AttemptDetail, AttemptExplorerFilter, AttemptExplorerMe, AttemptRow } from '@/types';
import { parseMeFromApiResponse, getApiErrorMessage } from '@/utils';

export function useAttemptExplorer(baseUrl: string) {
  const [attempts, setAttempts] = React.useState<AttemptRow[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [filter, setFilter] = React.useState<AttemptExplorerFilter>('ALL');
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [loadingMore, setLoadingMore] = React.useState(false);

  const [me, setMe] = React.useState<AttemptExplorerMe | null>(null);

  const [selectedAttemptId, setSelectedAttemptId] = React.useState<number | null>(null);
  const [attemptDetail, setAttemptDetail] = React.useState<AttemptDetail | null>(null);

  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [showIncorrectOnly, setShowIncorrectOnly] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      const res = await fetch(`${baseUrl}/me`);
      if (!res.ok) {
        if (!cancelled) setMe(null);
        return;
      }
      const data: unknown = await res.json().catch(() => null);
      const parsed = parseMeFromApiResponse(data);
      if (!cancelled) setMe(parsed);
    }

    void loadMe();
    return () => {
      cancelled = true;
    };
  }, [baseUrl]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadFirstPage() {
      setLoading(true);

      const res = await fetch(`${baseUrl}/attempts?filter=${filter}`);
      if (cancelled) return;

      if (!res.ok) {
        setAttempts([]);
        setNextCursor(null);
        setLoading(false);
        setSelectedAttemptId(null);
        setAttemptDetail(null);
        setShowIncorrectOnly(false);
        setDetailError(null);
        setDetailLoading(false);
        return;
      }

      const data = await res.json().catch(() => null);
      setAttempts(Array.isArray(data?.rows) ? (data.rows as AttemptRow[]) : []);
      setNextCursor(typeof data?.nextCursor === 'string' ? data.nextCursor : null);
      setLoading(false);

      setSelectedAttemptId(null);
      setAttemptDetail(null);
      setShowIncorrectOnly(false);
      setDetailError(null);
      setDetailLoading(false);
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
      const res = await fetch(`${baseUrl}/attempts?filter=${filter}&cursor=${nextCursor}`);
      if (!res.ok) return;

      const data = await res.json().catch(() => null);
      const newRows = Array.isArray(data?.rows) ? (data.rows as AttemptRow[]) : [];
      const newCursor = typeof data?.nextCursor === 'string' ? data.nextCursor : null;

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
      const res = await fetch(`${baseUrl}/attempts/${attemptId}`);
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setAttemptDetail(null);
        setDetailError(getApiErrorMessage(payload, 'Failed to load attempt details'));
        return;
      }

      setAttemptDetail(payload as AttemptDetail);
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

    me,
  } as const;
}
