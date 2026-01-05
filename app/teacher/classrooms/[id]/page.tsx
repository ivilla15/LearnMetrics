import { TeacherNav } from 'components/TeacherNav';
import ClassroomDashboardPage from './ClassroomDashboardPage';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const classroomId = Number(id);

  if (!Number.isFinite(classroomId) || classroomId <= 0) return <div>Invalid classroom id</div>;

  return (
    <>
      <TeacherNav classroomId={classroomId} />
      <ClassroomDashboardPage classroomId={classroomId} />
    </>
  );
}
