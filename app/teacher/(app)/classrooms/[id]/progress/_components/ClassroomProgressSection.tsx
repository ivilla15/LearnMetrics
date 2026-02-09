import { ClassroomProgressClient } from '@/modules';
import { getTeacherClassroomProgress } from '@/core/teacher/Progress';

export async function ClassroomProgressSection({
  teacherId,
  classroomId,
  days,
}: {
  teacherId: number;
  classroomId: number;
  days: number;
}) {
  const dto = await getTeacherClassroomProgress({ teacherId, classroomId, days });
  return <ClassroomProgressClient classroomId={classroomId} initial={dto} />;
}
