import { prisma } from '@/data/prisma';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import { DOMAIN_CODES, type DomainCode } from '@/types/domain';
import type { ProgressionPolicyInputDTO } from '@/types/api/progression';
import { clamp, uniq } from '@/utils/math';

const DEFAULT_DOMAINS: DomainCode[] = ['ADD_WHOLE', 'SUB_WHOLE', 'MUL_WHOLE', 'DIV_WHOLE'];

export async function getOrCreateClassroomPolicy(params: {
  teacherId: number;
  classroomId: number;
}) {
  await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  const existing = await prisma.classroomProgressionPolicy.findUnique({
    where: { classroomId: params.classroomId },
    select: { classroomId: true, enabledDomains: true, maxNumber: true, createdAt: true, updatedAt: true },
  });

  if (existing) {
    return {
      ...existing,
      createdAt: existing.createdAt.toISOString(),
      updatedAt: existing.updatedAt.toISOString(),
    };
  }

  const created = await prisma.classroomProgressionPolicy.create({
    data: { classroomId: params.classroomId, enabledDomains: DEFAULT_DOMAINS, maxNumber: 12 },
    select: { classroomId: true, enabledDomains: true, maxNumber: true, createdAt: true, updatedAt: true },
  });

  return {
    ...created,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  };
}

export async function updateClassroomPolicy(params: {
  teacherId: number;
  classroomId: number;
  input: ProgressionPolicyInputDTO;
}) {
  await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  const enabledDomains = uniq(params.input.enabledDomains).filter(
    (d): d is DomainCode => (DOMAIN_CODES as readonly string[]).includes(d),
  );

  if (enabledDomains.length === 0) {
    throw new Error('enabledDomains must include at least one domain');
  }

  const maxNumber = clamp(params.input.maxNumber, 1, 100);

  const result = await prisma.classroomProgressionPolicy.upsert({
    where: { classroomId: params.classroomId },
    create: { classroomId: params.classroomId, enabledDomains, maxNumber },
    update: { enabledDomains, maxNumber },
    select: { classroomId: true, enabledDomains: true, maxNumber: true, createdAt: true, updatedAt: true },
  });

  return {
    ...result,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}
