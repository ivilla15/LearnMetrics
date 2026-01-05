import { prisma } from '@/data/prisma';
import Link from 'next/link';
import { TeacherNav } from 'components/TeacherNav';
import { requireTeacher } from '@/core/auth/requireTeacher'; // adjust path

export default async function TeacherClassroomsPage() {
  const auth = await requireTeacher();
  if (!auth.ok) return <div>{auth.error}</div>;

  const teacherId = auth.teacher.id;

  const classrooms = await prisma.classroom.findMany({
    where: { teacherId },
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });

  if (classrooms.length === 0) {
    return <div className="p-6">No classrooms yet.</div>;
  }

  return (
    <>
      <TeacherNav />
      <main className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Your Classrooms</h1>

        <ul className="space-y-2">
          {classrooms.map((c) => (
            <li key={c.id}>
              <Link
                href={`/teacher/classrooms/${c.id}`}
                className="block rounded border border-gray-200 p-3 hover:bg-gray-50"
              >
                {c.name ?? `Classroom ${c.id}`}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
