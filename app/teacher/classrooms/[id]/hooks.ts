// app/teacher/classrooms/[id]/hooks.ts
'use client';

import { useEffect, useState } from 'react';

export type Classroom = { id: number; name?: string };

export type StudentRow = {
  id: number;
  name: string;
  username: string;
  level: number;
  lastAttempt: null | {
    assignmentId: number;
    score: number;
    total: number;
    percent: number;
    completedAt: string;
    wasMastery: boolean;
  };
};

type LatestAssignment = {
  id: number;
  classroomId: number;
  kind: string;
  opensAt: string;
  closesAt: string;
  windowMinutes: number;
} | null;

type Schedule = {
  id: number;
  classroomId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
  days: string[];
} | null;

type DashboardState = {
  classroom: Classroom | null;
  students: StudentRow[];
  latest: LatestAssignment;
  schedule: Schedule;
  loading: boolean;
  error: string | null;
};

type DashboardResult = DashboardState & {
  creatingFriday: boolean;
  createFridayNow: () => Promise<void>;
  savingSchedule: boolean;
  saveSchedule: (input: {
    opensAtLocalTime: string;
    windowMinutes: number;
    isActive: boolean;
    days: string[];
  }) => Promise<void>;
};

export function useClassroomDashboard(classroomId: number): DashboardResult {
  const [state, setState] = useState<DashboardState>({
    classroom: null,
    students: [],
    latest: null,
    schedule: null,
    loading: true,
    error: null,
  });

  const [creatingFriday, setCreatingFriday] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // ---- load dashboard data (unchanged) ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [rosterRes, latestRes, scheduleRes] = await Promise.all([
          fetch(`/api/classrooms/${classroomId}/roster`, {
            headers: { 'x-teacher-id': '2' }, // dev-only
          }),
          fetch(`/api/classrooms/${classroomId}/latest-assignment`, {
            headers: { 'x-teacher-id': '2' },
          }),
          fetch(`/api/classrooms/${classroomId}/schedule`, {
            headers: { 'x-teacher-id': '2' },
          }),
        ]);

        if (!rosterRes.ok) throw new Error('Failed to load roster');
        if (!latestRes.ok) throw new Error('Failed to load latest assignment');
        if (!scheduleRes.ok) throw new Error('Failed to load schedule');

        const rosterJson = await rosterRes.json();
        const latestJson = await latestRes.json();
        const scheduleJson = await scheduleRes.json();

        if (cancelled) return;

        setState({
          classroom: rosterJson.classroom ?? null,
          students: rosterJson.students ?? [],
          latest: latestJson.latest ?? null,
          schedule: scheduleJson.schedule ?? null,
          loading: false,
          error: null,
        });
      } catch (err: any) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: err?.message ?? 'Something went wrong loading classroom',
        }));
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  // ---- create Friday test (you already had this) ----
  async function createFridayNow() {
    const schedule = state.schedule;
    if (!schedule) {
      setState((prev) => ({
        ...prev,
        error: 'Cannot create Friday test: no schedule configured for this classroom.',
      }));
      return;
    }

    try {
      setCreatingFriday(true);
      const res = await fetch('/api/assignments/create-friday', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': '2', // dev-only
        },
        body: JSON.stringify({
          classroomId,
        }),
      });

      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      const data = await res.json();

      setState((prev) => ({
        ...prev,
        latest: data,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
    } finally {
      setCreatingFriday(false);
    }
  }

  // ---- NEW: save schedule (create or update) ----
  async function saveSchedule(input: {
    opensAtLocalTime: string;
    windowMinutes: number;
    isActive: boolean;
    days: string[];
  }) {
    try {
      setSavingSchedule(true);
      setState((prev) => ({ ...prev, error: null }));

      const res = await fetch(`/api/classrooms/${classroomId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': '2', // dev-only
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error(`Failed to save schedule (status ${res.status})`);
      }

      const data = await res.json();

      setState((prev) => ({
        ...prev,
        schedule: data.schedule ?? null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
      throw err; // let the card know it failed if it wants
    } finally {
      setSavingSchedule(false);
    }
  }

  return {
    ...state,
    creatingFriday,
    createFridayNow,
    savingSchedule,
    saveSchedule,
  };
}
