export async function cancelOccurrenceApi(
  classroomId: number,
  scheduleId: number,
  runDate: string,
  reason?: string,
) {
  const res = await fetch(`/api/teacher/classrooms/${classroomId}/schedule-runs/skip`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ scheduleId, runDate, reason }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error((json && json.error) || 'Failed to cancel occurrence');
  }
  return res.json();
}

export async function unskipOccurrenceApi(
  classroomId: number,
  scheduleId: number,
  runDate: string,
) {
  const res = await fetch(`/api/teacher/classrooms/${classroomId}/schedule-runs/unskip`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ scheduleId, runDate }),
  });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error((json && json.error) || 'Failed to unskip occurrence');
  }
  return res.json();
}
