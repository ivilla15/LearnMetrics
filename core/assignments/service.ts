import { prisma } from '@/data';
import { NotFoundError, ConflictError } from '@/core';
import { Prisma } from '@prisma/client';
import { AssignmentDTO, AssignmentRow } from '@/types';
import { requireTeacherActiveEntitlement } from '@/core/billing/entitlement';

type Params = {
  classroomId: number;
  opensAt: Date;
  closesAt: Date;
  windowMinutes: number | null;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  numQuestions?: number;
  kind?: 'SCHEDULED_TEST';
  questionSetId?: number | null;
  studentIds?: number[];
  skipReason?: string;

  scheduleId?: number | null;
  runDate?: Date;
};

function toDto(a: AssignmentRow): AssignmentDTO {
  return {
    id: a.id,
    classroomId: a.classroomId,
    kind: a.kind,
    opensAt: a.opensAt.toISOString(),
    closesAt: a.closesAt.toISOString(),
    windowMinutes: a.windowMinutes,
    assignmentMode: a.assignmentMode,
    numQuestions: a.numQuestions,
    recipientCount: a._count.recipients,
  };
}

export async function createScheduledAssignment(params: Params): Promise<AssignmentDTO> {
  const {
    classroomId,
    opensAt,
    closesAt,
    windowMinutes,
    assignmentMode,
    numQuestions = 12,
    kind = 'SCHEDULED_TEST',
    questionSetId = null,
    studentIds,

    scheduleId = null,
    runDate,
  } = params;

  if (!(opensAt instanceof Date) || Number.isNaN(opensAt.getTime())) {
    throw new ConflictError('Invalid opensAt');
  }
  if (!(closesAt instanceof Date) || Number.isNaN(closesAt.getTime())) {
    throw new ConflictError('Invalid closesAt');
  }
  if (closesAt <= opensAt) {
    throw new ConflictError('closesAt must be after opensAt');
  }

  // If scheduleId is provided, require runDate for idempotency.
  if (typeof scheduleId === 'number' && (!runDate || Number.isNaN(runDate.getTime()))) {
    throw new ConflictError('runDate is required when scheduleId is provided');
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, teacherId: true },
  });
  if (!classroom) throw new NotFoundError('Classroom not found');

  // ENTITLEMENT GATE: refuse creation when teacher entitlement is NOT active (expired/canceled).
  // Note: requireTeacherActiveEntitlement returns { ok: true, entitlement } for active; { ok: false } otherwise.
  const entGate = await requireTeacherActiveEntitlement(classroom.teacherId);
  if (!entGate.ok) {
    // Block creation if entitlement is not active (scheduler will auto-deactivate schedules).
    throw new ConflictError(entGate.error);
  }

  // IMPORTANT: trial users are allowed to create MANUAL assignments.
  // Therefore, no further blocking for manual mode for TRIAL.

  let normalizedStudentIds: number[] | null = null;

  if (Array.isArray(studentIds)) {
    const uniq = Array.from(new Set(studentIds)).filter((n) => Number.isFinite(n) && n > 0);
    if (uniq.length === 0) throw new ConflictError('studentIds must include at least one student');

    const found = await prisma.student.findMany({
      where: { id: { in: uniq }, classroomId },
      select: { id: true },
    });

    if (found.length !== uniq.length) {
      throw new ConflictError('One or more selected students are not in this classroom');
    }

    normalizedStudentIds = uniq;
  }

  // If not from a schedule run, create directly
  if (scheduleId == null) {
    const created: AssignmentRow = await prisma.assignment.create({
      data: {
        classroomId,
        opensAt,
        closesAt,
        windowMinutes: windowMinutes ?? 4,
        assignmentMode,
        numQuestions,
        kind,
        questionSetId: questionSetId ?? undefined,
        ...(normalizedStudentIds
          ? {
              recipients: {
                createMany: {
                  data: normalizedStudentIds.map((sid) => ({ studentId: sid })),
                  skipDuplicates: true,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        classroomId: true,
        kind: true,
        opensAt: true,
        closesAt: true,
        windowMinutes: true,
        assignmentMode: true,
        numQuestions: true,
        _count: { select: { recipients: true } },
      },
    });

    return toDto(created);
  }

  // ---- schedule-run path (idempotent via assignmentScheduleRun) ----
  const dto = await prisma.$transaction(async (tx) => {
    const run = await tx.assignmentScheduleRun.upsert({
      where: {
        scheduleId_runDate: { scheduleId, runDate: runDate! },
      },
      update: {},
      create: {
        scheduleId,
        runDate: runDate!,
      },
      select: { id: true, assignmentId: true, isSkipped: true },
    });

    if (run.isSkipped) {
      console.info(
        `Schedule ${scheduleId} run ${runDate!.toISOString()} is marked skipped, not creating assignment`,
      );
      throw new ConflictError('Schedule run was skipped');
    }

    if (run.assignmentId) {
      const existing = await tx.assignment.findUnique({
        where: { id: run.assignmentId },
        select: {
          id: true,
          classroomId: true,
          kind: true,
          opensAt: true,
          closesAt: true,
          windowMinutes: true,
          assignmentMode: true,
          numQuestions: true,
          _count: { select: { recipients: true } },
        },
      });

      if (existing) return toDto(existing as AssignmentRow);

      await tx.assignmentScheduleRun.update({
        where: { id: run.id },
        data: { assignmentId: null },
      });
    }

    let created: AssignmentRow;

    try {
      created = await tx.assignment.create({
        data: {
          classroomId,
          opensAt,
          closesAt,
          windowMinutes: windowMinutes ?? 4,
          assignmentMode,
          numQuestions,
          kind,
          questionSetId: questionSetId ?? undefined,
          scheduleId,
          runDate: runDate!,
          ...(normalizedStudentIds
            ? {
                recipients: {
                  createMany: {
                    data: normalizedStudentIds.map((sid) => ({ studentId: sid })),
                    skipDuplicates: true,
                  },
                },
              }
            : {}),
        },
        select: {
          id: true,
          classroomId: true,
          kind: true,
          opensAt: true,
          closesAt: true,
          windowMinutes: true,
          assignmentMode: true,
          numQuestions: true,
          _count: { select: { recipients: true } },
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        // Unique constraint (another process created the assignment) — fall back to existing.
        const existing = await tx.assignment.findFirst({
          where: { scheduleId, opensAt },
          select: {
            id: true,
            classroomId: true,
            kind: true,
            opensAt: true,
            closesAt: true,
            windowMinutes: true,
            assignmentMode: true,
            numQuestions: true,
            _count: { select: { recipients: true } },
          },
        });

        if (!existing) throw err;
        created = existing as AssignmentRow;
      } else {
        throw err;
      }
    }

    await tx.assignmentScheduleRun.update({
      where: { id: run.id },
      data: { assignmentId: created.id },
    });

    return toDto(created);
  });

  return dto;
}

export async function getLatestAssignmentForClassroom(
  classroomId: number,
): Promise<AssignmentDTO | null> {
  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    throw new ConflictError('Invalid classroomId');
  }

  const latest: AssignmentRow | null = await prisma.assignment.findFirst({
    where: { classroomId },
    orderBy: { opensAt: 'desc' },
    select: {
      id: true,
      classroomId: true,
      kind: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      assignmentMode: true,
      numQuestions: true,
      _count: { select: { recipients: true } },
    },
  });

  return latest ? toDto(latest) : null;
}
