'use client';

import * as React from 'react';
import type { PracticeProgressDTO } from '@/types/api/student';
import type { ApiErrorShape } from '@/utils/http';
import { getApiErrorMessage } from '@/utils/http';

type ProgressResponse = { progress: PracticeProgressDTO };

export function usePracticeProgress(assignmentId: number | null) {
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState<PracticeProgressDTO | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    if (!assignmentId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/student/assignments/${assignmentId}/practice-progress`, {
        cache: 'no-store',
        credentials: 'include',
      });

      const json = (await res.json().catch(() => null)) as ProgressResponse | ApiErrorShape | null;

      if (!res.ok) {
        throw new Error(getApiErrorMessage(json, 'Failed to load practice progress'));
      }

      const p = (json as ProgressResponse | null)?.progress ?? null;
      setProgress(p);
    } catch (e) {
      setProgress(null);
      setError(e instanceof Error ? e.message : 'Failed to load practice progress');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return { loading, progress, error, refresh } as const;
}
