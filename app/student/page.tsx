import Link from 'next/link';
import { requireStudent } from '@/core/auth/requireStudent';
import { StudentNav } from 'components/StudentNav';

export default async function StudentDashboardPage() {
  const auth = await requireStudent();
  if (!auth.ok) {
    // If not signed in, send them to login
    return (
      <div className="p-6">
        <p>Not signed in.</p>
        <Link className="underline" href="/student/login">
          Go to student login
        </Link>
      </div>
    );
  }

  const student = auth.student;

  return (
    <>
      <StudentNav />
      <main className="mx-auto max-w-2xl p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Welcome, {student.name}</h1>
          <p className="mt-1 text-sm text-gray-600">
            Current level: <span className="font-semibold">{student.level}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Link
            href="/student/progress"
            className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <p className="font-semibold">Progress</p>
            <p className="text-sm text-gray-600">See scores and missed questions.</p>
          </Link>

          <Link
            href="/student/dashboard"
            className="rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
          >
            <p className="font-semibold">Take a Test</p>
            <p className="text-sm text-gray-600">View available assignments.</p>
          </Link>
        </div>
      </main>
    </>
  );
}
