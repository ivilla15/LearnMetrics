// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

function isAuthed(req: NextRequest, cookieName: string) {
  const v = req.cookies.get(cookieName)?.value;
  return typeof v === 'string' && v.length > 0;
}

function isPublicPath(pathname: string) {
  // Next internals / assets
  if (pathname.startsWith('/_next')) return true;
  if (pathname === '/favicon.ico') return true;

  // Home
  if (pathname === '/') return true;

  // Student public pages
  if (pathname.startsWith('/student/login')) return true;
  if (pathname.startsWith('/student/logout')) return true;

  // (Soon) Student activation flow
  if (pathname.startsWith('/student/activate')) return true;

  // Teacher public pages
  if (pathname.startsWith('/teacher/login')) return true;
  if (pathname.startsWith('/teacher/logout')) return true;

  // Teacher signup flow
  if (pathname.startsWith('/teacher/signup')) return true;

  return false;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isStudent = isAuthed(req, 'student_session');
  const isTeacher = isAuthed(req, 'teacher_session');

  // ---- Public routes ----
  if (isPublicPath(pathname)) return NextResponse.next();

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
