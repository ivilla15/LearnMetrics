import TeacherLoginClient from '@/modules/teacher/login/LoginClient';

type SP = { next?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;

  return <TeacherLoginClient next={sp.next} />;
}
