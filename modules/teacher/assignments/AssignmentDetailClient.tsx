'use client';

import * as React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  HelpText,
  pill,
  Button,
} from '@/components';

import { AssignMakeupTestModal } from '../progress';

import { AttemptDetailModal, AttemptResultsTable, type AttemptResultsRow } from '@/modules';

import type { TeacherAssignmentAttemptsResponse, TeacherAssignmentAttemptRow } from './types';
import type { Filter } from '../progress/types';
import { formatLocal } from '@/lib/date';

type AssignmentSummary = NonNullable<TeacherAssignmentAttemptsResponse['assignment']>;

export function AssignmentDetailClient({
  classroomId,
  assignmentId,
  initial,
}: {
  classroomId: number;
  assignmentId: number;
  initial: TeacherAssignmentAttemptsResponse;
}) {
  const [data, setData] = React.useState<TeacherAssignmentAttemptsResponse>(initial);
  const [loading, setLoading] = React.useState(false);

  const [filter, setFilter] = React.useState<Filter>('ALL');

  // attempt detail modal state
  const [open, setOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<unknown | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);
  const [showIncorrectOnly, setShowIncorrectOnly] = React.useState(false);

  // assign test modal state
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assignStudents, setAssignStudents] = React.useState<
    Array<{
      id: number;
      name: string;
      username: string;
      flags?: { missedLastTest?: boolean; needsSetup?: boolean };
    }>
  >([]);
  const [assignLoading, setAssignLoading] = React.useState(false);
  const [assignError, setAssignError] = React.useState<string | null>(null);
  const [defaultSelectedIds, setDefaultSelectedIds] = React.useState<number[]>([]);

  async function openAssignModal() {
    setAssignError(null);
    setAssignOpen(true);

    setAssignLoading(true);
    try {
      // 1) load roster from existing progress endpoint
      const res = await fetch(`/api/teacher/classrooms/${classroomId}/progress?days=30`, {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load roster');
      }

      const roster = (json?.students ?? []) as Array<{
        id: number;
        name: string;
        username: string;
        flags?: { missedLastTest?: boolean; needsSetup?: boolean };
      }>;

      setAssignStudents(roster);

      // 2) compute "missing for THIS assignment" from the current assignment rows
      // attempted = has attemptId
      const attempted = new Set(rows.filter((r) => r.attemptId !== null).map((r) => r.studentId));

      // eligible = not needsSetup (matches your modal rule)
      const eligible = roster.filter((s) => !s.flags?.needsSetup);

      const missingIds = eligible.filter((s) => !attempted.has(s.id)).map((s) => s.id);

      setDefaultSelectedIds(missingIds);
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setAssignLoading(false);
    }
  }

  const [selected, setSelected] = React.useState<{
    studentName: string;
    studentUsername: string;
    studentId: number;
    attemptId: number;
  } | null>(null);

  async function reload(nextFilter: Filter) {
    setLoading(true);

    try {
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/assignments/${assignmentId}/attempts?filter=${nextFilter}`,
      );

      const data: TeacherAssignmentAttemptsResponse | null = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          typeof (data as { error?: string })?.error === 'string'
            ? (data as { error?: string }).error
            : 'Failed to load',
        );
      }

      const empty: TeacherAssignmentAttemptsResponse = {
        assignment: {
          assignmentId,
          kind: '',
          assignmentMode: 'MANUAL',
          opensAt: new Date(0).toISOString(),
          closesAt: new Date(0).toISOString(),
          windowMinutes: null,
          numQuestions: 0,
        },
        rows: [],
      };

      setData(data ?? empty);
    } finally {
      setLoading(false);
    }
  }

  async function openAttempt(row: TeacherAssignmentAttemptRow) {
    if (!row.attemptId) return;

    setSelected({
      studentName: row.name,
      studentUsername: row.username,
      studentId: row.studentId,
      attemptId: row.attemptId,
    });

    setOpen(true);
    setDetail(null);
    setDetailError(null);
    setShowIncorrectOnly(false);

    setDetailLoading(true);
    try {
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/students/${row.studentId}/attempts/${row.attemptId}`,
      );

      const json = (await res.json().catch(() => null)) as unknown;

      if (!res.ok) {
        const msg =
          json && typeof (json as { error?: unknown }).error === 'string'
            ? (json as { error: string }).error
            : 'Failed to load';
        throw new Error(msg);
      }

      setDetail(json);
    } catch (e) {
      setDetail(null);
      setDetailError(e instanceof Error ? e.message : 'Failed to load attempt details');
    } finally {
      setDetailLoading(false);
    }
  }

  const rows: TeacherAssignmentAttemptRow[] = Array.isArray(data?.rows) ? data.rows : [];
  const assignment: AssignmentSummary | null =
    data && data.assignment ? (data.assignment as AssignmentSummary) : null;

  const tableRows: AttemptResultsRow[] = rows.map((r) => ({
    studentId: r.studentId,
    name: r.name,
    username: r.username,
    attemptId: r.attemptId,
    completedAt: r.completedAt ?? null,
    score: r.score ?? null,
    total: r.total ?? null,
    percent: r.percent ?? null,
    missed: r.missed ?? null,
    wasMastery: r.wasMastery ?? null,
    levelAtTime: r.levelAtTime ?? null,
  }));

  const totalStudents = rows.length;
  const attemptedCount = rows.filter((r) => r.attemptId !== null).length;
  const masteryCount = rows.filter((r) => r.wasMastery === true).length;
  const missingCount = rows.filter((r) => r.attemptId === null).length;

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Assignment summary</CardTitle>
              <CardDescription>Overview for this specific assignment.</CardDescription>
            </div>

            <Button variant="primary" onClick={() => void openAssignModal()}>
              Assign test
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {pill(assignment?.assignmentMode ?? '—', 'muted')}
            {pill(assignment?.kind ?? '—', 'muted')}
            {pill(`${assignment?.numQuestions ?? 12} Q`, 'muted')}
          </div>

          <div className="text-sm text-[hsl(var(--muted-fg))]">
            Opens:{' '}
            <span className="text-[hsl(var(--fg))] font-medium">
              {formatLocal(assignment?.opensAt ?? null)}
            </span>
            {' · '}
            Closes:{' '}
            <span className="text-[hsl(var(--fg))] font-medium">
              {formatLocal(assignment?.closesAt ?? null)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {pill(`Attempted: ${attemptedCount}/${totalStudents}`, 'muted')}
            {pill(`Mastered: ${masteryCount}`, 'success')}
            {pill(`Missing: ${missingCount}`, 'warning')}
          </div>

          <HelpText>
            Click a student row to open their attempt details (reuses the same detail UI you already
            built).
          </HelpText>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <CardTitle>Student results</CardTitle>
          <CardDescription>
            Score, percent, missed, mastery, and level-at-time for every student.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <AttemptResultsTable
            rows={tableRows}
            loading={loading}
            showStudentColumn={true}
            searchEnabled={true}
            filterOptions={[
              { key: 'ALL', label: 'All' },
              { key: 'MASTERY', label: 'Mastery' },
              { key: 'NOT_MASTERY', label: 'Not mastery' },
              { key: 'MISSING', label: 'Missing' },
            ]}
            filter={filter}
            onChangeFilter={(key) => {
              const next = key as Filter;
              setFilter(next);
              void reload(next);
            }}
            onViewDetails={(row) => {
              if (!row.attemptId) return;
              const original = rows.find((x) => x.attemptId === row.attemptId);
              if (original) void openAttempt(original);
            }}
            helpText={
              <>
                Missing means there is no attempt record for this assignment (teacher may create a
                make-up test manually).
              </>
            }
          />
        </CardContent>
      </Card>
      <AssignMakeupTestModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        classroomId={classroomId}
        students={assignStudents}
        lastTestMeta={{
          numQuestions: assignment?.numQuestions ?? 12,
          windowMinutes: assignment?.windowMinutes ?? 4,
          questionSetId: null,
        }}
        defaultAudience="CUSTOM"
        defaultSelectedIds={defaultSelectedIds}
        onCreated={async () => {
          // reload this assignment attempts so the "Missing" count updates
          await reload(filter);
        }}
      />

      {assignLoading ? (
        <div className="text-xs text-[hsl(var(--muted-fg))]">Loading students…</div>
      ) : null}

      {assignError ? <div className="text-xs text-[hsl(var(--danger))]">{assignError}</div> : null}

      <AttemptDetailModal
        open={open}
        onClose={() => {
          setOpen(false);
          setSelected(null);
          setDetail(null);
          setDetailError(null);
          setDetailLoading(false);
          setShowIncorrectOnly(false);
        }}
        title="Attempt details"
        studentId={selected?.studentId ?? null}
        studentName={selected?.studentName ?? null}
        studentUsername={selected?.studentUsername ?? null}
        detail={detail as never}
        loading={detailLoading}
        error={detailError}
        showIncorrectOnly={showIncorrectOnly}
        onToggleIncorrectOnly={setShowIncorrectOnly}
      />
    </div>
  );
}
