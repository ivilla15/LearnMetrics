'use client';

import { useState } from 'react';
import { CreateManualTestDialog } from './CreateManualTestDialog';
import { useClassroomDashboard } from './hooks';
import { RosterTable } from './RosterTable';
import { LatestAssignmentCard } from './LatestAssignmentCard';
import { ScheduleCardList } from './ScheduleCardList';

type Props = {
  classroomId: number;
};

export default function ClassroomDashboardPage({ classroomId }: Props) {
  const {
    classroom,
    students,
    latest,
    schedules,
    loading,
    error,

    creatingSchedule,
    savingSchedule,
    savingRoster,

    // schedules
    updateScheduleById,
    deleteScheduleById,
    createNewSchedule,

    // roster
    bulkAddStudents,
    updateStudent,
    deleteStudent,
    deleteAllStudents,
    resetStudentAccess,

    // manual test
    createManualTest,
  } = useClassroomDashboard(classroomId);

  const busy = loading || savingSchedule || savingRoster;
  const [manualOpen, setManualOpen] = useState(false);

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!classroom) return <div>Classroom not found.</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{classroom.name ?? `Classroom ${classroom.id}`}</h1>
      </div>

      <CreateManualTestDialog
        open={manualOpen}
        busy={creatingSchedule}
        onClose={() => setManualOpen(false)}
        onCreate={async (input) => {
          await createManualTest(input);
          setManualOpen(false);
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="col-span-2">
          <RosterTable
            classroomId={classroomId}
            students={students}
            busy={busy}
            onBulkAdd={bulkAddStudents}
            onUpdateStudent={updateStudent}
            onDeleteStudent={deleteStudent}
            onDeleteAll={deleteAllStudents}
            onResetAccess={resetStudentAccess}
          />
        </div>

        <div className="space-y-4">
          <LatestAssignmentCard
            latest={latest}
            loading={loading}
            creating={creatingSchedule}
            onCreateSingleTest={() => setManualOpen(true)} // ✅ open dialog
          />

          <ScheduleCardList
            schedules={schedules}
            savingSchedule={savingSchedule}
            createNewSchedule={createNewSchedule}
            updateScheduleById={updateScheduleById}
            deleteScheduleById={deleteScheduleById}
          />
        </div>
      </div>
    </div>
  );
}
