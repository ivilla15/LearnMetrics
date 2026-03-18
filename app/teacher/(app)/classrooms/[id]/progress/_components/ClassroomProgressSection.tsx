import { ClassroomProgressClient } from '@/modules';
import { getClassroomProgress } from '@/core/progress';

export async function ClassroomProgressSection({
  teacherId,
  classroomId,
  days,
}: {
  teacherId: number;
  classroomId: number;
  days: number;
}) {
  const dto = await getClassroomProgress({ teacherId, classroomId, days });
  return <ClassroomProgressClient classroomId={classroomId} initial={dto} />;
}
