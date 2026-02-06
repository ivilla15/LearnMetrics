import TeacherSignupClient from '@/modules/teacher/signup/SignupClient';

type SP = { next?: string };

export default async function Page({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  return <TeacherSignupClient next={sp.next} />;
}
