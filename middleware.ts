import { NextResponse, type NextRequest } from 'next/server';

function isAuthed(req: NextRequest, cookieName: string) {
  const v = req.cookies.get(cookieName)?.value;
  return typeof v === 'string' && v.length > 0;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isStudent = isAuthed(req, 'student_session');
  const isTeacher = isAuthed(req, 'teacher_session');

  // ---- Public routes ----
  const isPublic =
    pathname === '/' ||
    pathname.startsWith('/student/login') ||
    pathname.startsWith('/teacher/login') ||
    pathname.startsWith('/student/logout') ||
    pathname.startsWith('/teacher/logout') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon');

  if (isPublic) return NextResponse.next();

  // ---- Protect student pages ----
  if (pathname.startsWith('/student')) {
    if (!isStudent) {
      const url = req.nextUrl.clone();
      url.pathname = '/student/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // ---- Protect teacher pages ----
  if (pathname.startsWith('/teacher')) {
    if (!isTeacher) {
      const url = req.nextUrl.clone();
      url.pathname = '/teacher/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

// Only run middleware on page routes (not API)
export const config = {
  matcher: ['/((?!api).*)'],
};
