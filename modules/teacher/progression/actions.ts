import type { ProgressionPolicyDTO, ProgressionPolicyInput } from '@/types/api/progression';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
}

function parsePolicyFromResponse(dataUnknown: unknown): ProgressionPolicyDTO {
  const obj = asRecord(dataUnknown);
  const policy = asRecord(obj?.policy);

  if (!policy) throw new Error('Invalid response: missing policy');
  return policy as ProgressionPolicyDTO;
}

export async function fetchProgressionPolicy(classroomId: number): Promise<ProgressionPolicyDTO> {
  const res = await fetch(`/api/teacher/classrooms/${classroomId}/progression`, {
    credentials: 'include',
    cache: 'no-store',
  });

  const dataUnknown: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      typeof asRecord(dataUnknown)?.error === 'string'
        ? (asRecord(dataUnknown)?.error as string)
        : 'Failed to load progression policy';
    throw new Error(msg);
  }

  return parsePolicyFromResponse(dataUnknown);
}

export async function saveProgressionPolicy(params: {
  classroomId: number;
  input: ProgressionPolicyInput;
}): Promise<ProgressionPolicyDTO> {
  const res = await fetch(`/api/teacher/classrooms/${params.classroomId}/progression`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params.input),
  });

  const dataUnknown: unknown = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      typeof asRecord(dataUnknown)?.error === 'string'
        ? (asRecord(dataUnknown)?.error as string)
        : 'Failed to save progression policy';
    throw new Error(msg);
  }

  return parsePolicyFromResponse(dataUnknown);
}

export async function safeRefreshPolicy(classroomId: number): Promise<ProgressionPolicyDTO | null> {
  try {
    return await fetchProgressionPolicy(classroomId);
  } catch {
    return null;
  }
}
