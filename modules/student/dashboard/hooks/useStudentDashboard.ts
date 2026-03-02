'use client';

import * as React from 'react';
import type { AttemptRowDTO, StudentMeDTO, StudentNextAssignmentDTO } from '@/types';
import { isAttemptRowDTO } from '@/types/guards';

type State = {
  loading: boolean;
  me: StudentMeDTO | null;
  nextAssignment: StudentNextAssignmentDTO | null;
  nextStatus: string | null;
  latestAttempt: AttemptRowDTO | null;
};

function unwrapField(json: unknown, field: string): unknown {
  if (!json || typeof json !== 'object') return json;
  const rec = json as Record<string, unknown>;
  return field in rec ? rec[field] : json;
}

function looksLikeStudentMe(v: unknown): v is StudentMeDTO {
  if (!v || typeof v !== 'object') return false;
  const rec = v as Record<string, unknown>;

  return (
    typeof rec.id === 'number' &&
    typeof rec.name === 'string' &&
    typeof rec.username === 'string' &&
    typeof rec.classroomId === 'number'
  );
}

function looksLikeStudentNextAssignment(v: unknown): v is StudentNextAssignmentDTO {
  if (v === null) return true;
  if (!v || typeof v !== 'object') return false;

  const rec = v as Record<string, unknown>;

  return (
    typeof rec.id === 'number' &&
    typeof rec.type === 'string' &&
    typeof rec.mode === 'string' &&
    typeof rec.opensAt === 'string' &&
    (rec.closesAt === null || typeof rec.closesAt === 'string')
  );
}

export function useStudentDashboard() {
  const [state, setState] = React.useState<State>({
    loading: true,
    me: null,
    nextAssignment: null,
    nextStatus: null,
    latestAttempt: null,
  });

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((s) => ({ ...s, loading: true }));

      const [meRes, nextRes, attemptsRes] = await Promise.all([
        fetch('/api/student/me'),
        fetch('/api/student/next-assignment'),
        fetch('/api/student/attempts?filter=ALL'),
      ]);

      if (cancelled) return;

      if (!meRes.ok) {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
        return;
      }

      const meJson: unknown = await meRes.json().catch(() => null);
      const nextJson: unknown = nextRes.ok ? await nextRes.json().catch(() => null) : null;
      const attemptsJson: unknown = attemptsRes.ok
        ? await attemptsRes.json().catch(() => null)
        : null;

      if (cancelled) return;

      const meCandidate = unwrapField(meJson, 'student');
      const me = looksLikeStudentMe(meCandidate) ? (meCandidate as StudentMeDTO) : null;

      const nextCandidate = unwrapField(nextJson, 'assignment');
      const nextAssignment = looksLikeStudentNextAssignment(nextCandidate)
        ? (nextCandidate as StudentNextAssignmentDTO)
        : null;

      let latestAttempt: AttemptRowDTO | null = null;
      if (attemptsJson && typeof attemptsJson === 'object') {
        const rec = attemptsJson as Record<string, unknown>;
        const rows = rec.rows;
        if (Array.isArray(rows)) {
          const parsed = rows.filter(isAttemptRowDTO);
          latestAttempt = parsed.length ? parsed[0] : null;
        }
      }

      setState({
        loading: false,
        me,
        nextAssignment,
        nextStatus: null,
        latestAttempt,
      });
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;

    async function loadStatus(id: number) {
      const res = await fetch(`/api/student/assignments/${id}`);
      const json: unknown = await res.json().catch(() => null);

      if (cancelled) return;

      if (!res.ok || !json || typeof json !== 'object') {
        setState((s) => ({ ...s, nextStatus: null }));
        return;
      }

      const rec = json as Record<string, unknown>;
      const status = typeof rec.status === 'string' ? rec.status : null;

      setState((s) => ({ ...s, nextStatus: status }));
    }

    const id = state.nextAssignment?.id ?? null;

    if (!id) {
      setState((s) => ({ ...s, nextStatus: null }));
      return;
    }

    void loadStatus(id);

    return () => {
      cancelled = true;
    };
  }, [state.nextAssignment?.id]);

  return state;
}
