import { NextResponse } from 'next/server';

export const TEACHER_SESSION_COOKIE = 'teacher_session';

export function setTeacherSessionCookie(res: NextResponse, token: string, maxAgeSeconds: number) {
  res.cookies.set(TEACHER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: maxAgeSeconds,
  });
}

export function clearTeacherSessionCookie(res: NextResponse) {
  res.cookies.set(TEACHER_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });
}
