import { prisma } from '@/data/prisma';
import { TeacherNav } from 'components/TeacherNav';
import TeacherStudentProgressClient from './TeacherStudentProgressClient';
import { requireTeacher } from '@/core/auth/requireTeacher';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div>{auth.error}</div>;

  const { id, studentId } = await params;
  const classroomIdNum = Number(id);
  const studentIdNum = Number(studentId);

  if (!Number.isFinite(classroomIdNum) || classroomIdNum <= 0)
    return <div>Invalid classroom id</div>;
  if (!Number.isFinite(studentIdNum) || studentIdNum <= 0) return <div>Invalid student id</div>;

  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomIdNum, teacherId: auth.teacher.id },
    select: { id: true, name: true },
  });

  if (!classroom) return <div>Not allowed</div>;

  return (
    <>
      <TeacherNav
        classroom={{ id: classroom.id, name: classroom.name ?? `Classroom ${classroom.id}` }}
      />
      <TeacherStudentProgressClient classroomId={classroomIdNum} studentId={studentIdNum} />
    </>
  );
}
