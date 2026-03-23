import { getStudentProgress } from '@/core/progress/studentProgress.service';
import { StudentProgressClient } from '@/modules/teacher/student-progress';

export async function StudentProgressSection({
  classroomId,
  studentId,
  teacherId,
}: {
  classroomId: number;
  studentId: number;
  teacherId: number;
}) {
  try {
    const dto = await getStudentProgress({
      teacherId,
      classroomId,
      studentId,
      days: 30,
    });

    return <StudentProgressClient classroomId={classroomId} studentId={studentId} initial={dto} />;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load student progress';
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{msg}</div>;
  }
}
