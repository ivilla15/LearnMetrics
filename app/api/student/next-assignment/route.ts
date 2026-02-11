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
        closesAt: { gt: now },
        OR: [{ recipients: { none: {} } }, { recipients: { some: { studentId: student.id } } }],
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

    // closesAt is nullable in the schema, but this query requires closesAt > now,
    // so it will be non-null here. Still, we’ll guard to keep TS happy and future-proof.
    if (!assignment.closesAt) {
      return NextResponse.json({ assignment: null }, { status: 200 });
    }

    return NextResponse.json(
      {
        assignment: {
          id: assignment.id,
          type: assignment.type, // 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT'
          mode: assignment.mode, // 'SCHEDULED' | 'MAKEUP' | 'MANUAL'
          opensAt: assignment.opensAt.toISOString(),
          closesAt: assignment.closesAt.toISOString(),
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