'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, StatBox } from '@/components';
import { DropdownMenu } from '@/components/overlays/DropdownMenu';
import type { TeacherClassroomCardRow } from '@/data/classrooms.repo';

export function ClassroomCard({
  classroom,
  onRename,
  onDelete,
}: {
  classroom: TeacherClassroomCardRow;
  onRename: () => void;
  onDelete: () => void;
}) {
  const name = classroom.name?.trim() ? classroom.name : `Classroom ${classroom.id}`;

  return (
    <div className="relative">
      <Link
        href={`/teacher/classrooms/${classroom.id}`}
        className="block"
        aria-label={`Open ${name}`}
      >
        <Card className="group shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0 transition-transform hover:-translate-y-px hover:shadow-[0_26px_70px_rgba(0,0,0,0.12)]">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <CardTitle className="truncate">{name}</CardTitle>
                <CardDescription>ID: {classroom.id}</CardDescription>
              </div>

              <div
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <DropdownMenu
                  buttonLabel="Open classroom actions"
                  items={[
                    { label: 'Rename', onSelect: onRename },
                    { label: 'Delete', tone: 'danger', onSelect: onDelete },
                  ]}
                />
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <StatBox align="center">
                <div className="text-[11px] text-[hsl(var(--muted-fg))]">Students</div>
                <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                  {classroom.studentCount}
                </div>
              </StatBox>

              <StatBox align="center">
                <div className="text-[11px] text-[hsl(var(--muted-fg))]">Schedules</div>
                <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                  {classroom.scheduleCount}
                </div>
              </StatBox>

              <StatBox align="center">
                <div className="text-[11px] text-[hsl(var(--muted-fg))]">Tests</div>
                <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                  {classroom.assignmentCount}
                </div>
              </StatBox>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
