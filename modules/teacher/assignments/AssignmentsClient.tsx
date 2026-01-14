'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  HelpText,
} from '@/components';

import type {
  TeacherAssignmentsListResponse,
  TeacherAssignmentListItem,
  AssignmentStatusFilter,
} from './types';

import { RecentAssignmentsCards, AssignmentsTable } from './';
import { formatLocal } from '@/lib/date';

export function AssignmentsClient({
  classroomId,
  initial,
}: {
  classroomId: number;
  initial: TeacherAssignmentsListResponse;
}) {
  const router = useRouter();

  const [data, setData] = React.useState<TeacherAssignmentsListResponse>(initial);
  const [loading, setLoading] = React.useState(false);

  const [status, setStatus] = React.useState<AssignmentStatusFilter>('all');
  const [search, setSearch] = React.useState('');

  async function reload(nextStatus: AssignmentStatusFilter) {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/assignments?status=${nextStatus}&limit=20`,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load');
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!data.nextCursor) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/assignments?status=${status}&limit=20&cursor=${data.nextCursor}`,
      );
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load');

      setData((prev) => ({
        ...prev,
        rows: [...(prev.rows ?? []), ...(json.rows ?? [])],
        nextCursor: json.nextCursor ?? null,
      }));
    } finally {
      setLoading(false);
    }
  }

  const rows = React.useMemo<TeacherAssignmentListItem[]>(() => {
    return Array.isArray(data?.rows) ? data.rows : [];
  }, [data?.rows]);

  const recent = React.useMemo(() => rows.slice(0, 3), [rows]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;

    return rows.filter((a: TeacherAssignmentListItem) => {
      const hay =
        `${a.assignmentId} ${a.kind} ${a.assignmentMode} ${formatLocal(a.opensAt)} ${formatLocal(
          a.closesAt,
        )}`.toLowerCase();
      return hay.includes(q);
    });
  }, [rows, search]);

  return (
    <div className="space-y-6">
      {/* Quick snapshot (like your last-3 tests UI) */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader className="space-y-2">
          <CardTitle>Recent assignments</CardTitle>
          <CardDescription>Quick snapshot of the most recent tests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recent.length === 0 ? (
            <div className="text-sm text-[hsl(var(--muted-fg))]">No assignments yet.</div>
          ) : (
            <RecentAssignmentsCards
              classroomId={classroomId}
              rows={recent}
              onOpen={(assignmentId) =>
                router.push(`/teacher/classrooms/${classroomId}/assignments/${assignmentId}`)
              }
            />
          )}

          <HelpText>
            Tip: Use the table below for Canvas-style browsing when you have lots of assignments.
          </HelpText>
        </CardContent>
      </Card>

      {/* All assignments (Canvas-style table) */}
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <CardTitle>All assignments</CardTitle>
          <CardDescription>Browse every assignment in this classroom.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-1 min-w-[220px]">
              <Label htmlFor="assign-search">Search</Label>
              <Input
                id="assign-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Type to filter…"
              />
            </div>

            <div className="grid gap-1">
              <Label>Status</Label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ['all', 'All'],
                    ['open', 'Open'],
                    ['closed', 'Closed'],
                    ['upcoming', 'Upcoming'],
                  ] as Array<[AssignmentStatusFilter, string]>
                ).map(([key, label]) => {
                  const active = status === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setStatus(key);
                        setSearch('');
                        void reload(key);
                      }}
                      className={[
                        'cursor-pointer rounded-[999px] border px-3 py-1.5 text-sm font-medium transition-colors',
                        active
                          ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <AssignmentsTable
            classroomId={classroomId}
            rows={filtered}
            onOpen={(assignmentId) =>
              router.push(`/teacher/classrooms/${classroomId}/assignments/${assignmentId}`)
            }
          />

          {data.nextCursor ? (
            <div className="flex items-center gap-3">
              <Button variant="secondary" disabled={loading} onClick={loadMore}>
                {loading ? 'Loading…' : 'Load more'}
              </Button>
              <div className="text-xs text-[hsl(var(--muted-fg))]">
                Older assignments load below.
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
