import * as React from 'react';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components';
import { ClassroomShellClient } from './ClassroomShellClient';
import { getTeacherClassroomHeader } from '@/core/classrooms/getTeacherClassroomHeader';

type Props = {
  classroomId: number;
  teacherId: number;
  currentPath: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

async function ClassroomTitle({ id, teacherId }: { id: number; teacherId: number }) {
  try {
    const header = await getTeacherClassroomHeader({ classroomId: id, teacherId });
    return <>{header.name || `Classroom ${id}`}</>;
  } catch {
    return <>Classroom {id}</>;
  }
}

export function ClassroomShell(props: Props) {
  const titleSlot = (
    <Suspense
      fallback={
        <div className="flex items-center gap-2">
          <LoadingSpinner label="" height="h-8" />
        </div>
      }
    >
      <ClassroomTitle id={props.classroomId} teacherId={props.teacherId} />
    </Suspense>
  );

  return <ClassroomShellClient {...props} title={titleSlot} />;
}
