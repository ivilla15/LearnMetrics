import Link from 'next/link';
import { cookies } from 'next/headers';

async function hasCookie(name: string) {
  const cookieStore = await cookies();
  const v = cookieStore.get(name)?.value;
  return typeof v === 'string' && v.length > 0;
}

export default async function HomePage() {
  const student = await hasCookie('student_session');
  const teacher = await hasCookie('teacher_session');

  return (
    <main className="mx-auto max-w-2xl p-8 space-y-6">
      <h1 className="text-3xl font-semibold">LearnMetrics</h1>
      <p className="text-gray-600">Practice, test, and track multiplication mastery.</p>

      <div className="flex flex-col gap-3 sm:flex-row">
        {student ? (
          <Link
            className="rounded-lg bg-blue-600 px-4 py-2 text-white font-semibold text-center"
            href="/student/dashboard"
          >
            Continue as Student
          </Link>
        ) : (
          <Link
            className="rounded-lg border border-gray-200 px-4 py-2 font-semibold text-center hover:bg-gray-50"
            href="/student/login"
          >
            Student Login
          </Link>
        )}

        {teacher ? (
          <Link
            className="rounded-lg bg-emerald-600 px-4 py-2 text-white font-semibold text-center"
            href="/teacher/classrooms"
          >
            Continue as Teacher
          </Link>
        ) : (
          <Link
            className="rounded-lg border border-gray-200 px-4 py-2 font-semibold text-center hover:bg-gray-50"
            href="/teacher/login"
          >
            Teacher Login
          </Link>
        )}
      </div>

      {(student || teacher) && (
        <div className="text-sm text-gray-600">
          <p className="mb-2 font-semibold">Signed in:</p>
          <div className="flex gap-3">
            {student && (
              <Link className="underline" href="/student/logout">
                Student Logout
              </Link>
            )}
            {teacher && (
              <Link className="underline" href="/teacher/logout">
                Teacher Logout
              </Link>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
