import * as React from 'react';
import { ClassroomStatsGrid } from '@/modules';
import { getTeacherClassroomOverview } from '@/core/classrooms/service';

type Props = {
  classroomId: number;
  teacherId: number;
};

export async function ClassroomOverviewSection({ classroomId, teacherId }: Props) {
  const overview = await getTeacherClassroomOverview({
    classroomId,
    teacherId,
  });

  if (!overview) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-[hsl(var(--border))] p-12 text-center">
        <p className="text-sm text-[hsl(var(--muted-fg))]">
          No overview data available for this classroom.
        </p>
      </div>
    );
  }

  return <ClassroomStatsGrid stats={overview} />;
}
