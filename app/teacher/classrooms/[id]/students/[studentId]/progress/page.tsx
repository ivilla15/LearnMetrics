import { TeacherNav } from 'components/TeacherNav';
import TeacherStudentProgressClient from './TeacherStudentProgressClient';

type PageProps = {
  params: Promise<{ id: string; studentId: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id, studentId } = await params;

  const classroomIdNum = Number(id);
  if (!Number.isFinite(classroomIdNum) || classroomIdNum <= 0) {
    return <div>Invalid classroom id</div>;
  }

  const studentIdNum = Number(studentId);
  if (!Number.isFinite(studentIdNum) || studentIdNum <= 0) {
    return <div>Invalid student id</div>;
  }

  return (
    <>
      <TeacherNav classroomId={classroomIdNum} />
      <TeacherStudentProgressClient classroomId={classroomIdNum} studentId={studentIdNum} />
    </>
  );
}
