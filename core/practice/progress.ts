import { NotFoundError, ConflictError } from '@/core';
import * as AssignmentsRepo from '@/data/assignments.repo';
import * as PracticeRepo from '@/data/practiceSessions.repo';
import type { PracticeProgressDTO } from '@/types/api/student';

export async function getPracticeProgressForAssignment(params: {
  studentId: number;
  assignmentId: number;
}): Promise<PracticeProgressDTO> {
  const { studentId, assignmentId } = params;

  const assignment = await AssignmentsRepo.findAssignmentById(assignmentId);
  if (!assignment) throw new NotFoundError('Assignment not found');

  if (assignment.targetKind !== 'PRACTICE_TIME') {
    throw new ConflictError('Assignment is not practice-time');
  }

  const recipientOk = await AssignmentsRepo.isStudentRecipientForAssignment({
    assignmentId,
    studentId,
  });
  if (!recipientOk) throw new ConflictError('You are not allowed to view this assignment');

  const requiredSeconds =
    typeof assignment.durationMinutes === 'number' && Number.isFinite(assignment.durationMinutes)
      ? Math.max(0, Math.trunc(assignment.durationMinutes) * 60)
      : 0;

  const windowStart = assignment.opensAt;
  const windowEnd =
    assignment.closesAt ??
    new Date(assignment.opensAt.getTime() + Math.max(0, assignment.windowMinutes) * 60_000);

  const completedSeconds = await PracticeRepo.sumPracticeSecondsInWindow({
    studentId,
    start: windowStart,
    end: windowEnd,
    operation: assignment.operation ?? null,
  });

  const safeCompleted = Math.max(0, Math.trunc(completedSeconds));
  const percent =
    requiredSeconds <= 0 ? 0 : Math.min(100, Math.round((safeCompleted / requiredSeconds) * 100));

  return {
    assignmentId,
    requiredSeconds,
    completedSeconds: safeCompleted,
    percent,
  };
}
