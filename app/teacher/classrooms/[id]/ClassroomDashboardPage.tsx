// app/teacher/classrooms/[id]/ClassroomDashboardPage.tsx
'use client';

import { useClassroomDashboard } from './hooks';

type Props = {
  classroomId: number;
};

export default function ClassroomDashboardPage({ classroomId }: Props) {
  const { classroom, students, latest, schedule, loading, error } =
    useClassroomDashboard(classroomId);

  if (loading) {
    return <div className="p-4">Loading classroom...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Failed to load classroom: {error}</div>;
  }

  if (!classroom) {
    return <div className="p-4">Classroom not found.</div>;
  }

  return (
    <main className="p-4 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">{classroom.name ?? 'Classroom'}</h1>
        <p className="text-sm text-gray-600">
          {students.length} student{students.length === 1 ? '' : 's'}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-[2fr,1fr]">
        {/* Left side: roster placeholder */}
        <section className="border rounded-md p-3">
          <h2 className="font-medium mb-2">Roster</h2>
          <p className="text-sm text-gray-500">Roster table will go here.</p>
        </section>

        {/* Right side: latest assignment + schedule placeholders */}
        <section className="space-y-4">
          <div className="border rounded-md p-3">
            <h2 className="font-medium mb-2">Latest assignment</h2>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(latest, null, 2)}
            </pre>
          </div>

          <div className="border rounded-md p-3">
            <h2 className="font-medium mb-2">Schedule</h2>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
              {JSON.stringify(schedule, null, 2)}
            </pre>
          </div>
        </section>
      </div>
    </main>
  );
}
