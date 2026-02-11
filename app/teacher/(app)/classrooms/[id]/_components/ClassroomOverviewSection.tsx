import { getTeacherClassroomOverview } from '@/core/classrooms';
import { ClassroomStatsGrid } from '@/modules';

export async function ClassroomOverviewSection({
  classroomId,
  teacherId,
}: {
  classroomId: number;
  teacherId: number;
}) {
  const overview = await getTeacherClassroomOverview({ classroomId, teacherId });
  return <ClassroomStatsGrid stats={overview} />;
}
