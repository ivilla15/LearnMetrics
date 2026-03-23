import { getRosterWithLastAttempt, getProgressionSnapshot } from '@/core';
import { PeopleClient } from '@/modules';

export async function PeopleSection({
  classroomId,
  teacherId,
}: {
  classroomId: number;
  teacherId: number;
}) {
  const [roster, policy] = await Promise.all([
    getRosterWithLastAttempt({ classroomId, teacherId }),
    getProgressionSnapshot(classroomId),
  ]);

  return (
    <PeopleClient
      classroomId={classroomId}
      initialStudents={roster.students}
      enabledOperations={policy.enabledOperations}
      operationOrder={policy.operationOrder}
      maxNumber={policy.maxNumber}
    />
  );
}
