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
  useToast,
  Modal,
} from '@/components';

import type {
  TeacherAssignmentsListResponse,
  TeacherAssignmentListItem,
  AssignmentStatusFilter,
} from './types';

import { RecentAssignmentsCards, AssignmentsTable } from './';
import { formatLocal } from '@/lib/date';
import { AssignMakeupTestModal } from '../progress';

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

  const toast = useToast();
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<number | null>(null);
  const [deleteBusy, setDeleteBusy] = React.useState(false);

  const [assignOpen, setAssignOpen] = React.useState(false);
  const [assignStudents, setAssignStudents] = React.useState<
    Array<{
      id: number;
      name: string;
      username: string;
      flags?: { missedLastTest?: boolean; needsSetup?: boolean };
    }>
  >([]);
  const [assignLastMeta, setAssignLastMeta] = React.useState<{
    numQuestions?: number;
    windowMinutes?: number | null;
    questionSetId?: number | null;
  } | null>(null);
  const [assignLoading, setAssignLoading] = React.useState(false);
  const [assignError, setAssignError] = React.useState<string | null>(null);

  async function openAssignModal() {
    setAssignError(null);
    setAssignOpen(true);

    // already loaded
    if (assignStudents.length > 0) return;

    setAssignLoading(true);
    try {
      const res = await fetch(`/api/teacher/classrooms/${classroomId}/progress?days=30`, {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof json?.error === 'string' ? json.error : 'Failed to load');

      const students = (json?.students ?? []) as Array<{
        id: number;
        name: string;
        username: string;
        flags?: { missedLastTest?: boolean; needsSetup?: boolean };
      }>;

      setAssignStudents(students);

      const last = json?.recent?.last3Tests?.[0] ?? null;
      setAssignLastMeta(
        last
          ? {
              numQuestions: last.numQuestions,
              windowMinutes: 4,
              questionSetId: null,
            }
          : null,
      );
    } catch (e) {
      setAssignError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setAssignLoading(false);
    }
  }

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
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>All assignments</CardTitle>
              <CardDescription>Browse every assignment in this classroom.</CardDescription>
            </div>

            <Button
              variant="primary"
              className="cursor-pointer"
              onClick={() => void openAssignModal()}
            >
              Assign test
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid gap-1 min-w-55">
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
            onDelete={(assignmentId) => setConfirmDeleteId(assignmentId)}
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

      {assignOpen ? (
        <AssignMakeupTestModal
          open={assignOpen}
          onClose={() => setAssignOpen(false)}
          classroomId={classroomId}
          students={assignStudents}
          lastTestMeta={assignLastMeta}
          defaultAudience="ALL"
        />
      ) : null}

      {assignLoading ? (
        <div className="text-xs text-[hsl(var(--muted-fg))]">Loading students…</div>
      ) : null}

      {assignError ? <div className="text-xs text-[hsl(var(--danger))]">{assignError}</div> : null}
      <Modal
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        title="Delete assignment?"
        description="This will permanently delete the assignment. This cannot be undone."
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmDeleteId(null)}
              disabled={deleteBusy}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={deleteBusy}
              onClick={async () => {
                if (!confirmDeleteId) return;

                try {
                  setDeleteBusy(true);

                  const res = await fetch(
                    `/api/classrooms/${classroomId}/assignments/${confirmDeleteId}`,
                    { method: 'DELETE', credentials: 'include' },
                  );

                  if (res.status !== 204) {
                    const data = await res.json().catch(() => null);
                    throw new Error(
                      typeof data?.error === 'string' ? data.error : 'Failed to delete assignment',
                    );
                  }

                  toast('Assignment deleted', 'success');
                  setConfirmDeleteId(null);

                  // refresh list
                  router.refresh();
                } catch (err) {
                  console.error(err);
                  toast((err as Error)?.message ?? 'Failed to delete assignment', 'error');
                } finally {
                  setDeleteBusy(false);
                }
              }}
            >
              {deleteBusy ? 'Deleting…' : 'Delete assignment'}
            </Button>
          </div>
        }
      >
        <div className="rounded-(--radius) border border-[hsl(var(--danger)/0.25)] bg-[hsl(var(--danger)/0.06)] p-3 text-sm">
          Deleting an assignment removes it from this classroom. Students will no longer be able to
          access it.
        </div>
      </Modal>
    </div>
  );
}
