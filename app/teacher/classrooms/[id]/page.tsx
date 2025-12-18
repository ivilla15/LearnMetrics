import ClassroomDashboardPage from './ClassroomDashboardPage';

type PageProps = {
  // 👇 params is now a Promise
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  // 👇 unwrap it first
  const { id } = await params;

  const classroomId = Number(id);

  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    return <div>Invalid classroom id</div>;
  }

  return <ClassroomDashboardPage classroomId={classroomId} />;
}
