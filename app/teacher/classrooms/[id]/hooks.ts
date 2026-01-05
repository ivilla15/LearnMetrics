// app/teacher/classrooms/[id]/hooks.ts
'use client';

import { useEffect, useState } from 'react';
import type { NewStudentInput } from '@/utils/students';
import { useToast } from '@/components/ToastProvider';

export type Classroom = { id: number; name?: string };

export type StudentRow = {
  id: number;
  name: string;
  username: string;
  password: string;
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
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  numQuestions: number;
} | null;

export type Schedule = {
  id: number;
  classroomId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
  days: string[];
  numQuestions: number;
};

export type ScheduleInput = {
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
  days: string[];
  numQuestions: number;
};

type DashboardState = {
  classroom: Classroom | null;
  students: StudentRow[];
  latest: LatestAssignment;
  schedule: Schedule | null; // primary
  schedules: Schedule[]; // all schedules
  loading: boolean;
  error: string | null;
};

type DashboardResult = DashboardState & {
  creatingSchedule: boolean;
  createScheduleNow: () => Promise<void>;

  savingSchedule: boolean;
  saveSchedule: (input: ScheduleInput) => Promise<void>;
  createNewSchedule: (input: ScheduleInput) => Promise<void>;
  updateScheduleById: (id: number, input: ScheduleInput) => Promise<void>;
  deleteScheduleById: (id: number) => Promise<void>;

  createManualTest: (input: {
    date: string;
    time: string;
    windowMinutes: number;
    numQuestions: number;
  }) => Promise<void>;

  savingRoster: boolean;
  bulkAddStudents: (students: NewStudentInput[]) => Promise<void>;
  updateStudent: (
    id: number,
    input: { name: string; username: string; level: number },
  ) => Promise<void>;
  deleteStudent: (id: number) => Promise<void>;
  deleteAllStudents: (options: {
    deleteAssignments: boolean;
    deleteSchedules: boolean;
  }) => Promise<void>;
};

function clampScheduleNumQuestions(n: number) {
  if (!Number.isFinite(n)) return 12;
  return Math.min(Math.max(Math.floor(n), 1), 12);
}

function teacherHeaders(extra?: Record<string, string>) {
  return {
    ...(extra ?? {}),
    // remove this line when real auth is ready
    ...(process.env.NODE_ENV === 'development' ? { 'x-teacher-id': '2' } : {}),
  };
}

export function useClassroomDashboard(classroomId: number): DashboardResult {
  const toast = useToast();
  const [state, setState] = useState<DashboardState>({
    classroom: null,
    students: [],
    latest: null,
    schedule: null,
    schedules: [],
    loading: true,
    error: null,
  });

  const [creatingSchedule, setCreatingSchedule] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [savingRoster, setSavingRoster] = useState(false);

  // ---- load dashboard data ----
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [rosterRes, latestRes, schedulesRes] = await Promise.all([
          fetch(`/api/classrooms/${classroomId}/roster`, {
            headers: teacherHeaders(), // dev-only
          }),
          fetch(`/api/classrooms/${classroomId}/latest-assignment`, {
            headers: teacherHeaders(),
          }),
          fetch(`/api/classrooms/${classroomId}/schedules`, {
            headers: teacherHeaders(),
          }),
        ]);

        if (!rosterRes.ok) throw new Error('Failed to load roster');
        if (!latestRes.ok) throw new Error('Failed to load latest assignment');
        if (!schedulesRes.ok) throw new Error('Failed to load schedules');

        const rosterData = await rosterRes.json();
        const latestData = await latestRes.json();
        const schedulesJson = await schedulesRes.json();

        if (cancelled) return;

        let classroom: Classroom | null = null;
        let students: StudentRow[] = [];

        if (Array.isArray(rosterData)) {
          students = rosterData as StudentRow[];
        } else {
          if (Array.isArray(rosterData?.students)) {
            students = rosterData.students as StudentRow[];
          }
          if (rosterData?.classroom && typeof rosterData.classroom.id === 'number') {
            classroom = {
              id: rosterData.classroom.id,
              name: rosterData.classroom.name,
            };
          }
        }

        const latest = (
          latestData && 'latest' in latestData ? (latestData as any).latest : latestData
        ) as LatestAssignment;

        const schedules = Array.isArray((schedulesJson as any).schedules)
          ? ((schedulesJson as any).schedules as Schedule[])
          : [];

        if (!classroom) {
          classroom = { id: classroomId };
        }

        setState({
          classroom,
          students,
          latest,
          schedule: schedules[0] ?? null, // primary = first
          schedules,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (cancelled) return;

        setState((prev) => ({
          ...prev,
          loading: false,
          error: (err as Error).message ?? 'Failed to load classroom dashboard.',
        }));
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  async function createScheduleNow() {
    const schedule = state.schedule;
    if (!schedule) {
      setState((prev) => ({
        ...prev,
        error: 'Cannot create scheduled test: no schedule configured for this classroom.',
      }));
      return;
    }

    try {
      setCreatingSchedule(true);
      setState((prev) => ({ ...prev, error: null }));

      const res = await fetch('/api/assignments/create-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': '2',
        },
        body: JSON.stringify({
          classroomId,
        }),
      });

      // ✅ read body ONCE
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const details = typeof json?.error === 'string' ? `: ${json.error}` : '';
        throw new Error(`Failed to create Scheduled test (status ${res.status}${details})`);
      }

      const created = (json?.assignment ?? json) as LatestAssignment;

      setState((prev) => ({
        ...prev,
        latest: created,
      }));
    } catch (err) {
      console.error('createScheduleNow error', err);
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
    } finally {
      setCreatingSchedule(false);
    }
  }

  async function createManualTest(input: {
    date: string;
    time: string;
    windowMinutes: number;
    numQuestions: number;
  }) {
    const safeNumQuestions = clampScheduleNumQuestions(input.numQuestions);

    if (safeNumQuestions !== input.numQuestions) {
      toast('For level-up tests, number of questions is capped at 12.', 'error');
    }

    try {
      setCreatingSchedule(true);
      setState((prev) => ({ ...prev, error: null }));

      const res = await fetch('/api/assignments/create-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': '2',
        },
        body: JSON.stringify({
          classroomId,
          scheduleDate: input.date,
          opensAtLocalTime: input.time,
          windowMinutes: input.windowMinutes,
          numQuestions: safeNumQuestions,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const details = typeof json?.error === 'string' ? `: ${json.error}` : '';
        throw new Error(`Failed to create manual test (status ${res.status}${details})`);
      }

      // ✅ API returns AssignmentDTO with `wasCreated`
      const created = (json?.assignment ?? json) as LatestAssignment & { wasCreated?: boolean };

      setState((prev) => ({
        ...prev,
        latest: created,
      }));

      if (created?.wasCreated === false) {
        toast('A test already exists for that exact date/time. Pick a different time.', 'error');
      } else {
        toast('Manual test created.', 'success');
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
      throw err;
    } finally {
      setCreatingSchedule(false);
    }
  }

  // ---- save primary schedule (create or update) ----
  async function saveSchedule(input: ScheduleInput) {
    try {
      setSavingSchedule(true);
      setState((prev) => ({ ...prev, error: null }));
      const safeInput = {
        ...input,
        numQuestions: clampScheduleNumQuestions(input.numQuestions),
      };

      const res = await fetch(`/api/classrooms/${classroomId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': '2', // dev-only
        },
        body: JSON.stringify(safeInput),
      });

      if (!res.ok) {
        throw new Error(`Failed to save schedule (status ${res.status})`);
      }

      const data = await res.json();
      const updatedSchedule = (data.schedule ?? null) as Schedule | null;

      setState((prev) => {
        const prevSchedules = prev.schedules ?? [];
        let nextSchedules = prevSchedules;

        if (updatedSchedule) {
          if (!prevSchedules.length) {
            nextSchedules = [updatedSchedule];
          } else {
            const idx = prevSchedules.findIndex((s) => s.id === updatedSchedule.id);
            if (idx === -1) {
              nextSchedules = [updatedSchedule, ...prevSchedules];
            } else {
              nextSchedules = [...prevSchedules];
              nextSchedules[idx] = updatedSchedule;
            }
          }
        }

        return {
          ...prev,
          schedule: updatedSchedule,
          schedules: nextSchedules,
        };
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
      throw err;
    } finally {
      setSavingSchedule(false);
    }
  }

  // ---- create a brand-new schedule (in addition to any existing ones) ----
  async function createNewSchedule(input: ScheduleInput) {
    try {
      setSavingSchedule(true);
      setState((prev) => ({ ...prev, error: null }));

      const safeInput = {
        ...input,
        numQuestions: clampScheduleNumQuestions(input.numQuestions),
      };

      const res = await fetch(`/api/classrooms/${classroomId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': '2', // dev-only
        },
        body: JSON.stringify(safeInput),
      });

      if (!res.ok) {
        throw new Error(`Failed to create schedule (status ${res.status})`);
      }

      const data = await res.json();
      const newSchedule = data.schedule as Schedule;

      setState((prev) => ({
        ...prev,
        schedule: prev.schedule, // keep primary as-is
        schedules: [...(prev.schedules ?? []), newSchedule],
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
      throw err;
    } finally {
      setSavingSchedule(false);
    }
  }

  // ---- update a specific schedule by id ----
  async function updateScheduleById(scheduleId: number, input: ScheduleInput) {
    try {
      setSavingSchedule(true);
      setState((prev) => ({ ...prev, error: null }));

      const safeInput = {
        ...input,
        numQuestions: clampScheduleNumQuestions(input.numQuestions),
      };

      const res = await fetch(`/api/classrooms/${classroomId}/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': '2', // dev-only
        },
        body: JSON.stringify(safeInput),
      });

      if (!res.ok) {
        throw new Error(`Failed to update schedule (status ${res.status})`);
      }

      const data = await res.json();
      const updated = data.schedule as Schedule;

      setState((prev) => ({
        ...prev,
        schedules: prev.schedules.map((s) => (s.id === updated.id ? updated : s)),
        schedule: prev.schedule?.id === updated.id ? updated : prev.schedule,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
      throw err;
    } finally {
      setSavingSchedule(false);
    }
  }

  // ---- delete a specific schedule by id ----
  async function deleteScheduleById(scheduleId: number) {
    try {
      setSavingSchedule(true);
      setState((prev) => ({ ...prev, error: null }));

      const res = await fetch(`/api/classrooms/${classroomId}/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'x-teacher-id': '2', // dev-only
        },
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete schedule (status ${res.status})`);
      }

      setState((prev) => {
        const nextSchedules = prev.schedules.filter((s) => s.id !== scheduleId);
        const nextPrimary =
          prev.schedule && prev.schedule.id === scheduleId
            ? (nextSchedules[0] ?? null)
            : prev.schedule;

        return {
          ...prev,
          schedules: nextSchedules,
          schedule: nextPrimary,
        };
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
      throw err;
    } finally {
      setSavingSchedule(false);
    }
  }

  // ---- bulk add students ----
  async function bulkAddStudents(newStudents: NewStudentInput[]) {
    try {
      setSavingRoster(true);
      setState((prev) => ({ ...prev, error: null }));

      const res = await fetch(`/api/classrooms/${classroomId}/students/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': '2', // dev-only
        },
        body: JSON.stringify({ students: newStudents }),
      });

      if (!res.ok) {
        throw new Error(`Failed to add students (status ${res.status})`);
      }

      const data = await res.json();
      const roster = (data.students ?? []) as StudentRow[];

      setState((prev) => ({
        ...prev,
        // 🔑 IMPORTANT: this is the full roster, so REPLACE, don't append
        students: roster,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
      throw err;
    } finally {
      setSavingRoster(false);
    }
  }

  // ---- update a specific student ----
  async function updateStudent(
    studentId: number,
    input: { name: string; username: string; level: number },
  ) {
    try {
      setSavingRoster(true);
      setState((prev) => ({ ...prev, error: null }));

      const res = await fetch(`/api/classrooms/${classroomId}/students/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': '2', // dev-only
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        throw new Error(`Failed to update student (status ${res.status})`);
      }

      const data = await res.json();
      const updated = data.student as StudentRow;

      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) => (s.id === updated.id ? updated : s)),
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
      throw err;
    } finally {
      setSavingRoster(false);
    }
  }

  // ---- delete a specific student ----
  async function deleteStudent(studentId: number) {
    try {
      setSavingRoster(true);
      setState((prev) => ({ ...prev, error: null }));

      const res = await fetch(`/api/classrooms/${classroomId}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'x-teacher-id': '2', // dev-only
        },
      });

      if (!res.ok && res.status !== 204) {
        throw new Error(`Failed to delete student (status ${res.status})`);
      }

      setState((prev) => ({
        ...prev,
        students: prev.students.filter((s) => s.id !== studentId),
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
      throw err;
    } finally {
      setSavingRoster(false);
    }
  }

  // ---- delete ALL students (optionally cascading) ----
  async function deleteAllStudents(options: {
    deleteAssignments: boolean;
    deleteSchedules: boolean;
  }) {
    try {
      setSavingRoster(true);
      setState((prev) => ({ ...prev, error: null }));

      const res = await fetch(`/api/classrooms/${classroomId}/students/delete-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-teacher-id': '2', // dev-only
        },
        body: JSON.stringify(options),
      });

      if (!res.ok) {
        throw new Error(`Failed to delete all students (status ${res.status})`);
      }

      setState((prev) => ({
        ...prev,
        students: [],
        latest: null,
        schedules: options.deleteSchedules ? [] : prev.schedules,
        schedule: options.deleteSchedules && prev.schedules.length ? null : prev.schedule,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: (err as Error).message ?? prev.error,
      }));
      throw err;
    } finally {
      setSavingRoster(false);
    }
  }

  return {
    ...state,
    creatingSchedule,
    createScheduleNow: createScheduleNow,
    createManualTest,

    savingSchedule,
    saveSchedule,
    createNewSchedule,
    updateScheduleById,
    deleteScheduleById,

    savingRoster,
    bulkAddStudents,
    updateStudent,
    deleteStudent,
    deleteAllStudents,
  };
}
