import TeacherAuthClient from '@/modules/teacher/auth/TeacherAuthClient';

type SP = { next?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  return <TeacherAuthClient next={sp.next} initialMode="signup" />;
}
