'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components';
import type { TeacherAssignmentListItem } from '@/types';
import { RecentAssignmentsCards } from './RecentAssignmentsCards';
export function RecentAssignmentsSection(props: {
  classroomId: number;
  rows: TeacherAssignmentListItem[];
  onOpen: (assignmentId: number) => void;
}) {
  const { classroomId, rows, onOpen } = props;

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="space-y-2">
        <CardTitle>Recent assignments</CardTitle>
        <CardDescription>Quick snapshot of the most recent tests.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {rows.length === 0 ? (
          <div className="text-sm text-[hsl(var(--muted-fg))]">No assignments yet.</div>
        ) : (
          <RecentAssignmentsCards classroomId={classroomId} rows={rows} onOpen={onOpen} />
        )}
      </CardContent>
    </Card>
  );
}
