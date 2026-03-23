import { ProgressionClient } from '@/modules';
import { ProgressionPolicyDTO } from '@/types';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch.app';
import { getApiErrorMessage } from '@/utils/http';

export async function ProgressionSection({ classroomId }: { classroomId: number }) {
  const baseUrl = await getBaseUrlFromHeaders();
  const cookie = await getCookieHeader();

  const res = await fetch(`${baseUrl}/api/teacher/classrooms/${classroomId}/progression`, {
    method: 'GET',
    headers: cookie ? { cookie } : undefined,
    cache: 'no-store',
  });

  const payload: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = getApiErrorMessage(payload, 'Failed to load progression policy');
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{msg}</div>;
  }

  const policy =
    payload && typeof payload === 'object'
      ? ((payload as Record<string, unknown>).policy as ProgressionPolicyDTO | undefined)
      : undefined;

  if (!policy) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid policy response</div>;
  }

  return <ProgressionClient classroomId={classroomId} initialPolicy={policy} />;
}
