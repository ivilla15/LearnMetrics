import { MarketingPageClient } from '@/modules/marketing';
import { cookies } from 'next/headers';

async function hasCookie(name: string) {
  const cookieStore = await cookies();
  const v = cookieStore.get(name)?.value;
  return typeof v === 'string' && v.length > 0;
}

export default async function HomePage() {
  const student = await hasCookie('student_session');
  const teacher = await hasCookie('teacher_session');

  const primaryLink = teacher
    ? { href: '/teacher/classrooms', label: 'Dashboard' }
    : student
      ? { href: '/student/dashboard', label: 'Dashboard' }
      : { href: '/teacher/login', label: 'Teacher Login' };

  const secondaryLink = teacher
    ? { href: '/student/dashboard', label: 'Student View' }
    : student
      ? { href: '/teacher/classrooms', label: 'Teacher View' }
      : { href: '/student/login', label: 'Student Login' };

  const isLoggedIn = student || teacher;

  return (
    <main className="min-h-screen">
      <MarketingPageClient
        primaryLink={primaryLink}
        secondaryLink={secondaryLink}
        isLoggedIn={isLoggedIn}
      />
    </main>
  );
}
