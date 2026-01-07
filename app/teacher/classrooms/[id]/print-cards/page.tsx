// app/teacher/classrooms/[id]/print-cards/page.tsx
import PrintCardsClient from './PrintCardsClient';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const classroomId = Number(id);

  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    return <div className="p-6">Invalid classroom id</div>;
  }

  return <PrintCardsClient classroomId={classroomId} />;
}
