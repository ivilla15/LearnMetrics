import crypto from 'crypto';
import { prisma } from '@/data/prisma';
import { expiresAtFromNow } from '@/utils/time';

const SESSION_TTL_DAYS = 14;

type PrismaLike = {
  studentSession: {
    create: typeof prisma.studentSession.create;
  };
};

export async function createStudentSession(studentId: number, tx: PrismaLike = prisma) {
  const token = crypto.randomBytes(32).toString('base64url');

  await tx.studentSession.create({
    data: {
      token,
      studentId,
      expiresAt: expiresAtFromNow(SESSION_TTL_DAYS),
    },
  });

  return {
    token,
    maxAgeSeconds: SESSION_TTL_DAYS * 24 * 60 * 60,
  };
}
