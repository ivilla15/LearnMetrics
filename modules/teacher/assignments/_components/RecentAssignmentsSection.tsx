'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components';
import type { TeacherAssignmentListItemDTO } from '@/types';
import { RecentAssignmentsCards } from './RecentAssignmentsCards';

export function RecentAssignmentsSection(props: {
  classroomId: number;
  rows: TeacherAssignmentListItemDTO[];
  loading?: boolean;
  onOpen: (assignmentId: number) => void;
}) {
  const { classroomId, rows, loading = false, onOpen } = props;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="space-y-2">
        <CardTitle>Recent assignments</CardTitle>
        <CardDescription>
          Quick snapshot of recent tests and practice-time assignments.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <RecentAssignmentsCards
            classroomId={classroomId}
            rows={[]}
            loading={true}
            onOpen={onOpen}
          />
        ) : rows.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))] italic py-4">No assignments yet.</div>
        ) : (
          <RecentAssignmentsCards
            classroomId={classroomId}
            rows={rows}
            loading={false}
            onOpen={onOpen}
          />
        )}
      </CardContent>
    </Card>
  );
}
