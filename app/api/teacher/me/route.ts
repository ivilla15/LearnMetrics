import { NextResponse } from 'next/server';

import { requireTeacher } from '@/core';
import { handleApiError } from '@/app';

export async function GET() {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    return NextResponse.json({ teacher: auth.teacher }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
