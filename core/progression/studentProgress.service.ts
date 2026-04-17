import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';
import { DOMAIN_CODES, type DomainCode } from '@/types/domain';
import { DOMAIN_CONFIG } from '@/core/domain';
import type { StudentProgressLiteDTO } from '@/types/api/progression';
import { getProgressionSnapshot } from './policySnapshot.service';
import { assertTeacherOwnsStudent } from '@/core/students/ownership';

export async function ensureStudentProgress(studentId: number): Promise<void> {
  const existing = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { domain: true },
  });
  const have = new Set(existing.map((r) => r.domain));
  const missing = (DOMAIN_CODES as readonly DomainCode[]).filter((d) => !have.has(d));
  if (missing.length > 0) {
    await prisma.studentProgress.createMany({
      data: missing.map((d) => ({ studentId, domain: d, level: 1 })),
      skipDuplicates: true,
    });
  }
}

export async function getTeacherStudentProgressRows(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
}): Promise<StudentProgressLiteDTO[]> {
  await assertTeacherOwnsStudent(params);
  const snapshot = await getProgressionSnapshot(params.classroomId);
  await ensureStudentProgress(params.studentId);

  const rows = await prisma.studentProgress.findMany({
    where: { studentId: params.studentId },
    select: { domain: true, level: true },
  });

  const enabledSet = new Set(snapshot.enabledDomains);
  return rows
    .filter((r) => enabledSet.has(r.domain))
    .map((r) => ({ domain: r.domain, level: r.level }));
}

export async function setTeacherStudentProgressRows(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
  levels: StudentProgressLiteDTO[];
}): Promise<StudentProgressLiteDTO[]> {
  await assertTeacherOwnsStudent(params);
  await ensureStudentProgress(params.studentId);

  const snapshot = await getProgressionSnapshot(params.classroomId);
  const enabledSet = new Set(snapshot.enabledDomains);

  const updates = params.levels
    .filter((row) => enabledSet.has(row.domain))
    .map((row) => ({
      domain: row.domain,
      level: Math.max(
        0,
        Math.min(DOMAIN_CONFIG[row.domain]?.maxLevel ?? snapshot.maxNumber, Math.trunc(row.level)),
      ),
    }));

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map((row) =>
        prisma.studentProgress.update({
          where: { studentId_domain: { studentId: params.studentId, domain: row.domain } },
          data: { level: row.level },
        }),
      ),
    );
  }

  const rows = await prisma.studentProgress.findMany({
    where: { studentId: params.studentId },
    select: { domain: true, level: true },
  });
  return rows
    .filter((r) => enabledSet.has(r.domain))
    .map((r) => ({ domain: r.domain, level: r.level }));
}

/**
 * Places a student at a specific domain and level using full placement semantics:
 *   - domains BEFORE the target in the enabled order → graduated sentinel
 *   - the TARGET domain                              → clamped level
 *   - domains AFTER the target                       → 1 (not started)
 */
export async function placeStudentAtDomainFull(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
  domain: DomainCode;
  level: number;
}): Promise<StudentProgressLiteDTO[]> {
  await assertTeacherOwnsStudent(params);
  await ensureStudentProgress(params.studentId);

  const snapshot = await getProgressionSnapshot(params.classroomId);
  const domainOrder = snapshot.enabledDomains;
  const maxLevel = DOMAIN_CONFIG[params.domain]?.maxLevel ?? snapshot.maxNumber;
  const clampedLevel = Math.max(0, Math.min(maxLevel, Math.trunc(params.level)));
  const targetIdx = domainOrder.indexOf(params.domain);

  const updates: Array<{ domain: DomainCode; level: number }> = [];

  if (targetIdx !== -1) {
    for (let i = 0; i < domainOrder.length; i++) {
      const d = domainOrder[i]!;
      const dMax = DOMAIN_CONFIG[d]?.maxLevel ?? snapshot.maxNumber;
      let level: number;
      if (i < targetIdx) level = dMax + 1;
      else if (i === targetIdx) level = clampedLevel;
      else level = 1;
      updates.push({ domain: d, level });
    }
  } else {
    updates.push({ domain: params.domain, level: clampedLevel });
  }

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map((row) =>
        prisma.studentProgress.upsert({
          where: { studentId_domain: { studentId: params.studentId, domain: row.domain } },
          create: { studentId: params.studentId, domain: row.domain, level: row.level },
          update: { level: row.level },
        }),
      ),
    );
  }

  const rows = await prisma.studentProgress.findMany({
    where: { studentId: params.studentId },
    select: { domain: true, level: true },
  });
  const enabledSet = new Set(snapshot.enabledDomains);
  return rows
    .filter((r) => enabledSet.has(r.domain))
    .map((r) => ({ domain: r.domain, level: r.level }));
}

export async function getStudentProgressRows(studentId: number): Promise<StudentProgressLiteDTO[]> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { classroomId: true },
  });
  if (!student) throw new NotFoundError('Student not found');

  const snapshot = await getProgressionSnapshot(student.classroomId);
  await ensureStudentProgress(studentId);

  const rows = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { domain: true, level: true },
  });
  const enabledSet = new Set(snapshot.enabledDomains);
  return rows
    .filter((r) => enabledSet.has(r.domain))
    .map((r) => ({ domain: r.domain, level: r.level }));
}
