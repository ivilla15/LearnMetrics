import type {
  AssignmentMode,
  AssignmentTargetKind,
  AssignmentType,
  OperationCode,
} from '@/types/enums';
import type { ProgressionModifier } from './progression';
import { OperandValue } from './question';

export type StudentMeDTO = {
  id: number;
  name: string;
  username: string;
  classroomId: number;
  progress: {
    operation: OperationCode;
    level: number;
  };
};

export type StudentNextAssignmentDTO = {
  id: number;
  type: AssignmentType;
  mode: AssignmentMode;
  opensAt: string; // ISO
  closesAt: string | null; // ISO
  windowMinutes: number | null;
  numQuestions: number;
} | null;

export type StudentAssignmentStatus = 'NOT_OPEN' | 'CLOSED' | 'READY' | 'ALREADY_SUBMITTED';

export type StudentQuestionDTO = {
  id: number;
  operandA: OperandValue;
  operandB: OperandValue;
  operation: OperationCode;
};

export type StudentAssignmentDTO = {
  id: number;

  type: AssignmentType;
  mode: AssignmentMode;
  targetKind: AssignmentTargetKind;

  opensAt: string;
  closesAt: string | null;

  windowMinutes: number | null;

  numQuestions: number;
  durationMinutes: number | null;

  requiredSets: number | null;
  minimumScorePercent: number | null;
};

export type PracticeProgressionDTO = {
  operation: OperationCode;
  level: number;
  maxNumber: number;
  modifier: ProgressionModifier;
  numQuestionsPerSet: number;
};

export type AlreadySubmittedResultDTO = {
  score: number;
  total: number;
  percent: number;
  completedAt: string | null;
};

export type StudentAssignmentLoadResponse =
  | { status: 'NOT_OPEN'; assignment: StudentAssignmentDTO }
  | { status: 'CLOSED'; assignment: StudentAssignmentDTO }
  | { status: 'READY_PRACTICE_TIME'; assignment: StudentAssignmentDTO; progression: PracticeProgressionDTO }
  | {
      status: 'ALREADY_SUBMITTED';
      assignment: StudentAssignmentDTO;
      attemptId: number;
      result: {
        score: number;
        total: number;
        percent: number;
        completedAt: string | null;
      };
    }
  | {
      status: 'READY';
      student: { id: number; name: string; operation: OperationCode; level: number };
      assignment: StudentAssignmentDTO;
      questions: StudentQuestionDTO[];
      sessionStartedAt: string; // ISO — server-recorded draft attempt start time
    };

export type PracticeProgressDTO = {
  assignmentId: number;
  requiredSets: number;
  completedSets: number;
  minimumScorePercent: number;
  percent: number;
};
