import { NextResponse } from 'next/server';
import { requireStudent } from '@/core';
import { handleApiError } from '@/app';
import { getProgressionSnapshot } from '@/core';

export async function GET() {
  try {
    const auth = await requireStudent();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const snap = await getProgressionSnapshot(auth.student.classroomId);

    return NextResponse.json(
      {
        maxNumber: snap.maxNumber,
        enabledDomains: snap.enabledDomains,
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export type StudentPracticeConfigDTO = {
  maxNumber: number;
  enabledDomains: string[];
};
