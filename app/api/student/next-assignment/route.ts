import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core';
import { handleApiError } from '@/app';
import { jsonResponse, errorResponse } from '@/utils/http';

export async function GET() {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const student = auth.student;
    const now = new Date();

    const assignment = await prisma.assignment.findFirst({
      where: {
        classroomId: student.classroomId,
        targetKind: 'ASSESSMENT',

        opensAt: { lte: now },
        OR: [{ closesAt: null }, { closesAt: { gt: now } }],

        AND: [
          {
            OR: [
              // no recipients => everyone
              { recipients: { none: {} } },
              // targeted
              { recipients: { some: { studentId: student.id } } },
            ],
          },
          // not already submitted
          { Attempt: { none: { studentId: student.id } } },
        ],
      },
      orderBy: { opensAt: 'asc' },
      select: {
        id: true,
        type: true,
        mode: true,
        opensAt: true,
        closesAt: true,
        windowMinutes: true,
        numQuestions: true,
      },
    });

    if (!assignment) {
      return jsonResponse(null, 200);
    }

    return jsonResponse(
      {
        id: assignment.id,
        type: assignment.type,
        mode: assignment.mode,
        opensAt: assignment.opensAt.toISOString(),
        closesAt: assignment.closesAt ? assignment.closesAt.toISOString() : null,
        windowMinutes: assignment.windowMinutes ?? null,
        numQuestions: assignment.numQuestions ?? 12,
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
