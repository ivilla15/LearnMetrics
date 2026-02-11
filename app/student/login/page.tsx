import StudentAuthClient from '@/modules/student/auth/StudentAuthClient';

export default async function Page() {
  return <StudentAuthClient initialMode="signup" />;
}
