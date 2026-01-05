// app/api/student/me/route.ts
import { NextResponse } from 'next/server';
import { requireStudent } from '@/core/auth/requireStudent';

export async function GET() {
  const auth = await requireStudent();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  return NextResponse.json({ student: auth.student }, { status: 200 });
}
