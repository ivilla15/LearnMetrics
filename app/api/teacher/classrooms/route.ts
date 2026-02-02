import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireTeacher } from '@/core';
import { jsonError } from '@/utils';
import { readJson, handleApiError } from '@/app';
import { createTeacherClassroom } from '@/core/classrooms/createTeacherClassroom';

const CreateClassroomSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

type TeacherPlan = 'TRIAL' | 'PRO' | 'SCHOOL';
type EntitlementStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELED';

export async function POST(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const raw = await readJson(req);
    const { name, timeZone } = CreateClassroomSchema.parse(raw);

    const tz =
      typeof timeZone === 'string' && timeZone.trim() ? timeZone.trim() : 'America/Los_Angeles';

    const classroom = await createTeacherClassroom({
      teacherId: auth.teacher.id,
      name,
      timeZone: tz,
    });

    return NextResponse.json({ ok: true, classroom }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
