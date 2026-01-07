// app/teacher/classrooms/[id]/page.tsx
import { TeacherNav } from 'components/TeacherNav';
import ClassroomDashboardPage from './ClassroomDashboardPage';
import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core/auth/requireTeacher';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (!auth.ok) {
    return <div>{auth.error}</div>;
  }

  const { id } = await params;
  const classroomId = Number(id);

  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    return <div>Invalid classroom id</div>;
  }

  // ✅ Fetch classroom once, enforce ownership
  const classroom = await prisma.classroom.findFirst({
    where: {
      id: classroomId,
      teacherId: auth.teacher.id,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!classroom) {
    return <div>Classroom not found</div>;
  }

  return (
    <>
      <TeacherNav classroom={classroom} />
      <ClassroomDashboardPage classroomId={classroom.id} />
    </>
  );
}
