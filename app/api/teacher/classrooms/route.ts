import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core/auth/requireTeacher';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const auth = await requireTeacher();
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? '').trim();

  if (!name) return jsonError('Missing classroom name', 400);
  if (name.length > 80) return jsonError('Classroom name too long', 400);

  const classroom = await prisma.classroom.create({
    data: {
      name,
      teacherId: auth.teacher.id,
    },
    select: { id: true, name: true },
  });

  return NextResponse.json({ ok: true, classroom }, { status: 201 });
}
