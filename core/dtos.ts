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
  classroom: { id: string; name: string };
  students: {
    id: string;
    name: string;
    username: string;
    level: number;
    lastAttempt: {
      assignmentId: string;
      score: number;
      total: number;
      percent: number;
      completedAt: string;
      wasMastery: boolean;
    } | null;
  }[];
}
