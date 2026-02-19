import { NextResponse } from 'next/server';

import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core';
import { handleApiError } from '@/app';

export async function GET() {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const student = auth.student;
    const now = new Date();

    const assignment = await prisma.assignment.findFirst({
      where: {
        classroomId: student.classroomId,
        opensAt: { lte: now },

        OR: [{ closesAt: null }, { closesAt: { gt: now } }],

        AND: [
          {
            OR: [{ recipients: { none: {} } }, { recipients: { some: { studentId: student.id } } }],
          },
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
      return NextResponse.json({ assignment: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        assignment: {
          id: assignment.id,
          type: assignment.type,
          mode: assignment.mode,
          opensAt: assignment.opensAt.toISOString(),
          closesAt: assignment.closesAt ? assignment.closesAt.toISOString() : null,
          windowMinutes: assignment.windowMinutes,
          numQuestions: assignment.numQuestions ?? 12,
        },
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
