export type TeacherClassroomCardRowDTO = {
  id: number;
  name: string | null;
  studentCount: number;
  scheduleCount: number;
  assignmentCount: number;
};

export type TeacherClassroomOverviewStatsDTO = {
  classroom: {
    timeZone: string | null;
  };

  totalStudents: number;
  activeStudents: number;
  needsSetup: number;
  activeSchedules: number;

  nextTest: null | {
    opensAt: string; // ISO
    closesAt: string | null; // ISO
    mode: import('../enums').AssignmentMode;
  };

  masteryLast7: number;
  attemptsLast7: number;
};
