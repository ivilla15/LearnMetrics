import Link from 'next/link';

type Props = {
  classroom?: {
    id: number;
    name: string;
  };
};

export function TeacherNav({ classroom }: Props) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold">
            LearnMetrics
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link href="/teacher/classrooms" className="text-gray-700 hover:underline">
              Classrooms
            </Link>

            {classroom && (
              <>
                <span className="text-gray-400">/</span>
                <Link
                  href={`/teacher/classrooms/${classroom.id}`}
                  className="font-medium text-gray-900 hover:underline"
                >
                  {classroom.name}
                </Link>
              </>
            )}
          </nav>
        </div>

        <Link
          href="/teacher/logout"
          className="rounded border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50"
        >
          Logout
        </Link>
      </div>
    </header>
  );
}
