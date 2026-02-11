import StudentAssignmentClient from '@/modules/student/assignments/StudentAssignmentClient';

export default async function StudentAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudentAssignmentClient assignmentIdParam={id} />;
}
