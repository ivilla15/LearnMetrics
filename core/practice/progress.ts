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
    throw new ConflictError('Assignment is not a practice assignment');
  }

  const recipientOk = await AssignmentsRepo.isStudentRecipientForAssignment({
    assignmentId,
    studentId,
  });
  if (!recipientOk) throw new ConflictError('You are not allowed to view this assignment');

  const requiredSets =
    typeof assignment.requiredSets === 'number' && assignment.requiredSets > 0
      ? assignment.requiredSets
      : 1;

  const minimumScorePercent =
    typeof assignment.minimumScorePercent === 'number' && assignment.minimumScorePercent > 0
      ? assignment.minimumScorePercent
      : 80;

  const completedSets = await PracticeRepo.countQualifyingSets({ studentId, assignmentId });

  const safeCompleted = Math.max(0, completedSets);
  const percent =
    requiredSets <= 0 ? 0 : Math.min(100, Math.round((safeCompleted / requiredSets) * 100));

  return {
    assignmentId,
    requiredSets,
    completedSets: safeCompleted,
    minimumScorePercent,
    percent,
  };
}
