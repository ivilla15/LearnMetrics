export interface AssignmentDTO {
  id: string;
  classroomId: string;
  kind: 'SCHEDULED_TEST';
  opensAt: string; // UTC ISO
  closesAt: string; // UTC ISO
  opensAtLocal: string; // PT ISO
  closesAtLocal: string; // PT ISO
  windowMinutes: number;
  wasCreated: boolean;
}

export interface RosterDTO {
  classroom: { id: number; name: string; timeZone: string };
  students: {
    id: number;
    name: string;
    username: string;
    level: number;
    mustSetPassword: boolean;
    lastAttempt: {
      assignmentId: number;
      score: number;
      total: number;
      percent: number;
      completedAt: string;
      wasMastery: boolean;
    } | null;
  }[];
}
