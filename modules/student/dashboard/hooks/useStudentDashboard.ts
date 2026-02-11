'use client';

import * as React from 'react';
import type { AssignmentStatus, AttemptRow, MeDTO, NextAssignmentDTO } from '@/types';
import { isAttemptRow, isMeDTO, isNextAssignment } from '@/utils';

type State = {
  loading: boolean;
  me: MeDTO | null;
  nextAssignment: NextAssignmentDTO;
  nextStatus: AssignmentStatus;
  latestAttempt: AttemptRow | null;
};

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

      if (!meRes.ok) {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
        return;
      }

      const meJson: unknown = await meRes.json().catch(() => null);
      const nextJson: unknown = await nextRes.json().catch(() => null);
      const attemptsJson: unknown = await attemptsRes.json().catch(() => null);

      if (cancelled) return;

      const meCandidate =
        meJson && typeof meJson === 'object'
          ? ((meJson as { student?: unknown }).student ?? meJson)
          : null;

      const nextCandidate =
        nextJson && typeof nextJson === 'object'
          ? ((nextJson as { assignment?: unknown }).assignment ?? nextJson)
          : null;

      const rows =
        attemptsJson && typeof attemptsJson === 'object'
          ? (attemptsJson as { rows?: unknown[] }).rows
          : null;

      const parsedAttempts = Array.isArray(rows) ? rows.filter(isAttemptRow) : [];
      const latestAttempt = parsedAttempts.length ? parsedAttempts[0] : null;

      setState({
        loading: false,
        me: isMeDTO(meCandidate) ? meCandidate : null,
        nextAssignment: isNextAssignment(nextCandidate) ? nextCandidate : null,
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

      setState((s) => ({
        ...s,
        nextStatus: ((json as { status?: AssignmentStatus }).status ?? null) as AssignmentStatus,
      }));
    }

    const id = state.nextAssignment?.id;
    if (!id) {
      setState((s) => ({ ...s, nextStatus: null }));
      return;
    }

    void loadStatus(id);

    return () => {
      cancelled = true;
    };
  }, [state.nextAssignment]);

  return state;
}
