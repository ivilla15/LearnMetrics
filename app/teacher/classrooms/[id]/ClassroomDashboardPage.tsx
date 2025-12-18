// app/teacher/classrooms/[id]/ClassroomDashboardPage.tsx
'use client';

import { useClassroomDashboard } from './hooks';
import RosterTable from './RosterTable';
import { ScheduleCard } from './ScheduleCard';
import { LatestAssignmentCard } from './LatestAssignmentCard';

type Props = {
  classroomId: number;
};

export default function ClassroomDashboardPage({ classroomId }: Props) {
  const {
    classroom,
    students,
    latest,
    schedule,
    loading,
    error,
    creatingFriday,
    createFridayNow,
    savingSchedule,
    saveSchedule,
  } = useClassroomDashboard(classroomId);

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!classroom) return <div>Classroom not found.</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold">{classroom.name ?? `Classroom ${classroom.id}`}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2">
          <RosterTable students={students} />
        </div>

        <div className="space-y-6 col-span-1">
          <LatestAssignmentCard
            latest={latest}
            creating={creatingFriday}
            onCreateFriday={createFridayNow}
          />

          <ScheduleCard
            schedule={schedule}
            loading={loading}
            saving={savingSchedule}
            onSave={saveSchedule}
          />
        </div>
      </div>
    </div>
  );
}
