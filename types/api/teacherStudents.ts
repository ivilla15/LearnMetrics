import type { AssignmentMode, AssignmentType } from '@/types/enums';

export type AttemptHistoryItemDTO = {
  attemptId: number;
  assignmentId: number;
  classroomId: number;

  type: AssignmentType;
  mode: AssignmentMode;

  score: number;
  total: number;
  percent: number;
  completedAt: string;
  wasMastery: boolean;

  opensAt: string;
  closesAt: string | null;
};

export type StudentHistoryResponse = {
  student: {
    id: number;
    name: string;
    username: string;
  };
  attempts: AttemptHistoryItemDTO[];
};

export type UpdateStudentArgs = {
  teacherId: number;
  classroomId: number;
  studentId: number;
  input: { name: string; username: string };
};

export type DeleteStudentArgs = {
  teacherId: number;
  classroomId: number;
  studentId: number;
};

export type DeleteAllStudentsArgs = {
  teacherId: number;
  classroomId: number;
  deleteAssignments: boolean;
  deleteSchedules: boolean;
};

import type { OperationCode } from '@/types/enums';
import type { BulkAddResponseDTO } from '@/types/api/roster';

export type BulkAddStudentInputDTO = {
  firstName: string;
  lastName: string;
  username: string;
  startingOperation?: OperationCode;
  startingLevel?: number;
};

export type BulkAddStudentsArgs = {
  teacherId: number;
  classroomId: number;
  students: BulkAddStudentInputDTO[];
};

export type { BulkAddResponseDTO };
