import { NextResponse } from 'next/server';

import { requireStudent } from '@/core';
import { handleApiError } from '@/app';

export async function GET() {
  try {
    const auth = await requireStudent();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    return NextResponse.json({ student: auth.student }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
