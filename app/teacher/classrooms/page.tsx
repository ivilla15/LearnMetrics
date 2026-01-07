// app/teacher/classrooms/page.tsx
import Link from 'next/link';
import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core/auth/requireTeacher';
import { TeacherNav } from 'components/TeacherNav';
import { revalidatePath } from 'next/cache';

function clampName(raw: unknown) {
  const name = String(raw ?? '').trim();
  if (!name) return { ok: false as const, error: 'Classroom name is required.' };
  if (name.length > 80) return { ok: false as const, error: 'Classroom name must be ≤ 80 chars.' };
  return { ok: true as const, name };
}

async function createClassroomAction(formData: FormData) {
  'use server';

  const auth = await requireTeacher();
  if (!auth.ok) return;

  const parsed = clampName(formData.get('name'));
  if (!parsed.ok) return;

  await prisma.classroom.create({
    data: {
      name: parsed.name,
      teacherId: auth.teacher.id, // never trust client-provided teacherId
    },
  });
  revalidatePath('/teacher/classrooms');
}

async function renameClassroomAction(formData: FormData) {
  'use server';

  const auth = await requireTeacher();
  if (!auth.ok) return;

  const classroomIdRaw = formData.get('classroomId');
  const classroomId = Number(classroomIdRaw);
  if (!Number.isFinite(classroomId) || classroomId <= 0) return;

  const parsed = clampName(formData.get('name'));
  if (!parsed.ok) return;

  // Ownership enforcement
  const owned = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId: auth.teacher.id },
    select: { id: true },
  });
  if (!owned) return;

  await prisma.classroom.update({
    where: { id: classroomId },
    data: { name: parsed.name },
  });
  revalidatePath('/teacher/classrooms');
}

async function deleteClassroomAction(formData: FormData) {
  'use server';

  const auth = await requireTeacher();
  if (!auth.ok) return;

  const classroomIdRaw = formData.get('classroomId');
  const classroomId = Number(classroomIdRaw);
  if (!Number.isFinite(classroomId) || classroomId <= 0) return;

  // Ownership enforcement
  const owned = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId: auth.teacher.id },
    select: { id: true },
  });
  if (!owned) return;

  // Cascade deletes are handled by Prisma relations (onDelete: Cascade)
  await prisma.classroom.delete({ where: { id: classroomId } });
  revalidatePath('/teacher/classrooms');
}

export default async function TeacherClassroomsPage() {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6">{auth.error}</div>;

  const classrooms = await prisma.classroom.findMany({
    where: { teacherId: auth.teacher.id },
    select: { id: true, name: true },
    orderBy: { id: 'asc' },
  });

  return (
    <>
      <TeacherNav />
      <main className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Your Classrooms</h1>
          <p className="text-sm text-gray-600">
            Create a classroom, then add students and schedules inside it.
          </p>
        </header>

        {/* Create classroom */}
        <section className="rounded-xl border border-gray-200 p-4 space-y-3 max-w-xl">
          <h2 className="text-sm font-semibold text-gray-800">Create a classroom</h2>

          <form action={createClassroomAction} className="flex flex-col gap-2 sm:flex-row">
            <input
              name="name"
              placeholder="Example: Period 1"
              className="h-11 flex-1 rounded-lg border border-gray-200 px-3 text-sm"
              maxLength={80}
            />
            <button className="h-11 rounded-lg bg-black px-4 text-sm font-semibold text-white">
              Create
            </button>
          </form>

          <p className="text-xs text-gray-500">
            Tip: Keep names short so they print nicely on student login cards later.
          </p>
        </section>

        {/* List */}
        <section className="space-y-3">
          {classrooms.length === 0 ? (
            <div className="rounded-xl border border-gray-200 p-6 text-sm text-gray-600">
              No classrooms yet. Create one above.
            </div>
          ) : (
            <ul className="space-y-3">
              {classrooms.map((c) => (
                <li key={c.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <Link
                        href={`/teacher/classrooms/${c.id}`}
                        className="text-base font-semibold text-gray-900 hover:underline"
                      >
                        {c.name || `Classroom ${c.id}`}
                      </Link>
                      <p className="text-xs text-gray-500">ID: {c.id}</p>
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/teacher/classrooms/${c.id}`}
                        className="inline-flex h-9 items-center rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                      >
                        Open
                      </Link>
                    </div>
                  </div>

                  {/* Rename */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-700">Rename classroom</p>
                    <form
                      action={renameClassroomAction}
                      className="flex flex-col gap-2 sm:flex-row"
                    >
                      <input type="hidden" name="classroomId" value={c.id} />
                      <input
                        name="name"
                        defaultValue={c.name ?? ''}
                        className="h-10 flex-1 rounded-lg border border-gray-200 px-3 text-sm"
                        maxLength={80}
                      />
                      <button className="h-10 rounded-lg bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700">
                        Save
                      </button>
                    </form>
                  </div>

                  {/* Delete */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-red-800">Danger zone</p>
                    <form action={deleteClassroomAction}>
                      <input type="hidden" name="classroomId" value={c.id} />
                      <button className="h-9 rounded-lg border border-red-300 bg-red-600 px-3 text-xs font-semibold text-white hover:bg-red-700">
                        Delete classroom
                      </button>
                    </form>
                    <p className="text-[11px] text-red-700">
                      Deletes this classroom and all related students, assignments, schedules, and
                      attempts.
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
