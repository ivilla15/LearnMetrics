import * as RunsRepo from '@/data/scheduleRuns.repo';

export async function ensureScheduleRun(params: { scheduleId: number; runDate: Date }) {
  const { scheduleId, runDate } = params;

  const existing = await RunsRepo.findRunByScheduleAndDate({ scheduleId, runDate });
  if (existing) return { run: existing, created: false as const };

  const created = await RunsRepo.createRun({ scheduleId, runDate });
  return { run: created, created: true as const };
}

export async function linkRunToAssignment(params: { runId: number; assignmentId: number }) {
  return RunsRepo.attachAssignmentToRun(params);
}
