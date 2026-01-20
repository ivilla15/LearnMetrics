import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core';
import { jsonError } from '@/utils';
import { readJson, handleApiError } from '@/app';

const CreateClassroomSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

export async function POST(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const raw = await readJson(req);
    const { name } = CreateClassroomSchema.parse(raw);

    const classroom = await prisma.classroom.create({
      data: {
        name,
        teacherId: auth.teacher.id,
      },
      select: { id: true, name: true },
    });

    return NextResponse.json({ ok: true, classroom }, { status: 201 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
