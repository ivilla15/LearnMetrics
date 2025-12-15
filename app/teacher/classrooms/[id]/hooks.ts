// app/teacher/classrooms/[id]/hooks.ts
'use client';

import { useEffect, useState } from 'react';

type Classroom = { id: number; name?: string };

type StudentRow = {
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
  questionSetId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
} | null;

type DashboardState = {
  classroom: Classroom | null;
  students: StudentRow[];
  latest: LatestAssignment;
  schedule: Schedule;
  loading: boolean;
  error: string | null;
};

export function useClassroomDashboard(classroomId: number): DashboardState {
  const [state, setState] = useState<DashboardState>({
    classroom: null,
    students: [],
    latest: null,
    schedule: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [rosterRes, latestRes, scheduleRes] = await Promise.all([
          fetch(`/api/classrooms/${classroomId}/roster`, {
            headers: { 'x-teacher-id': '1' }, // dev-only hack
          }),
          fetch(`/api/classrooms/${classroomId}/latest-assignment`, {
            headers: { 'x-teacher-id': '1' },
          }),
          fetch(`/api/classrooms/${classroomId}/schedule`, {
            headers: { 'x-teacher-id': '1' },
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

  return state;
}
