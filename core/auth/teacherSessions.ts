import crypto from 'crypto';
import { prisma } from '@/data/prisma';
import { expiresAtFromNow } from '@/utils/time';

const SESSION_TTL_DAYS = 14;

type PrismaLike = {
  teacherSession: {
    create: typeof prisma.teacherSession.create;
  };
};

export async function createTeacherSession(teacherId: number, tx: PrismaLike = prisma) {
  const token = crypto.randomBytes(32).toString('base64url');

  await tx.teacherSession.create({
    data: {
      token,
      teacherId,
      expiresAt: expiresAtFromNow(SESSION_TTL_DAYS),
    },
  });

  return {
    token,
    maxAgeSeconds: SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}
