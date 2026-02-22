import * as RunsRepo from '@/data/scheduleRuns.repo';
import { ConflictError } from '@/core/errors';

function assertPositiveInt(n: number, name: string) {
  if (!Number.isInteger(n) || n <= 0) throw new ConflictError(`Invalid ${name}`);
}

function assertValidDate(d: Date, name: string) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) throw new ConflictError(`Invalid ${name}`);
}

export async function ensureScheduleRun(params: { scheduleId: number; runDate: Date }) {
  assertPositiveInt(params.scheduleId, 'scheduleId');
  assertValidDate(params.runDate, 'runDate');

  const existing = await RunsRepo.findRunByScheduleAndDate({
    scheduleId: params.scheduleId,
    runDate: params.runDate,
  });
  if (existing) return { run: existing, created: false as const };

  const created = await RunsRepo.createRun({
    scheduleId: params.scheduleId,
    runDate: params.runDate,
  });
  return { run: created, created: true as const };
}

export async function linkRunToAssignment(params: { runId: number; assignmentId: number }) {
  assertPositiveInt(params.runId, 'runId');
  assertPositiveInt(params.assignmentId, 'assignmentId');
  return RunsRepo.attachAssignmentToRun(params);
}

export async function unlinkRunFromAssignment(params: { runId: number }) {
  assertPositiveInt(params.runId, 'runId');
  return RunsRepo.attachAssignmentToRun({ runId: params.runId, assignmentId: null });
}
