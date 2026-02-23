import { requireStudent } from '@/core/auth/requireStudent';
import { getPracticeProgressForAssignment } from '@/core/practice/progress';
import { jsonResponse } from '@/utils/http';
import { handleApiError } from '@/app/api/_shared';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) {
      return jsonResponse({ error: auth.error }, 401);
    }

    const { id } = await ctx.params;
    const assignmentId = Number(id);

    if (!Number.isFinite(assignmentId) || assignmentId <= 0) {
      return jsonResponse({ error: 'Invalid assignment id' }, 400);
    }

    const progress = await getPracticeProgressForAssignment({
      studentId: auth.student.id,
      assignmentId,
    });

    return jsonResponse({ progress }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Failed to load practice progress' });
  }
}
