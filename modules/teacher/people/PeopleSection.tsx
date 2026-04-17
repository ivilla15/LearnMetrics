import { getRosterWithLastAttempt, getProgressionSnapshot } from '@/core';
import { PeopleClient } from '@/modules';
import type { DomainCode } from '@/types/domain';

export async function PeopleSection({
  classroomId,
  teacherId,
}: {
  classroomId: number;
  teacherId: number;
}) {
  const [roster, snapshot] = await Promise.all([
    getRosterWithLastAttempt({ classroomId, teacherId }),
    getProgressionSnapshot(classroomId),
  ]);

  return (
    <PeopleClient
      classroomId={classroomId}
      initialStudents={roster.students}
      enabledDomains={snapshot.enabledDomains as DomainCode[]}
      maxNumber={snapshot.maxNumber}
    />
  );
}
