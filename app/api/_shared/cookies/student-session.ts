import { NextResponse } from 'next/server';

export const STUDENT_SESSION_COOKIE = 'student_session';

export function setStudentSessionCookie(res: NextResponse, token: string, maxAgeSeconds: number) {
  res.cookies.set(STUDENT_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeSeconds,
  });
}

export function clearStudentSessionCookie(res: NextResponse) {
  res.cookies.set(STUDENT_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}
