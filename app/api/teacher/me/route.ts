// app/api/teacher/me/route.ts
import { NextResponse } from 'next/server';
import { requireTeacher } from '@/core/auth/requireTeacher';

export async function GET() {
  const auth = await requireTeacher();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.json({ teacher: auth.teacher }, { status: 200 });
}
