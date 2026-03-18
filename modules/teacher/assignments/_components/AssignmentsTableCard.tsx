'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Button } from '@/components';
import type { AssignmentStatusFilter, TeacherAssignmentListItemDTO } from '@/types';
import { AssignmentsTable, AssignmentsToolbar } from '@/modules';

export function AssignmentsTableCard(props: {
  classroomId: number;

  status: AssignmentStatusFilter;
  search: string;
  setSearch: (v: string) => void;
  onChangeStatus: (s: AssignmentStatusFilter) => void;

  rows: TeacherAssignmentListItemDTO[];

  loading: boolean;
  nextCursor: string | null;
  onLoadMore: () => void;

  onOpenAssign: () => void;

  onOpen: (assignmentId: number) => void;
  onDelete: (assignmentId: number) => void;
}) {
  const {
    classroomId,
    status,
    search,
    setSearch,
    onChangeStatus,
    rows,
    loading,
    nextCursor,
    onLoadMore,
    onOpenAssign,
    onOpen,
    onDelete,
  } = props;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>
              Browse tests and practice-time assignments in this classroom.
            </CardDescription>
          </div>

          <Button variant="primary" className="cursor-pointer" onClick={onOpenAssign}>
            Assign
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <AssignmentsToolbar
          status={status}
          search={search}
          setSearch={setSearch}
          onChangeStatus={onChangeStatus}
        />

        <AssignmentsTable
          classroomId={classroomId}
          rows={rows}
          onOpen={onOpen}
          onDelete={onDelete}
        />

        {nextCursor ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" disabled={loading} onClick={onLoadMore}>
              {loading ? 'Loading…' : 'Load more'}
            </Button>
            <div className="text-xs text-[hsl(var(--muted-fg))]">Older assignments load below.</div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
