import { requireTeacher, createScheduledAssignment } from '@/core';
import { classroomIdParamSchema, createManualAssignmentRequestSchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, readJson, type RouteContext } from '@/app';

export async function POST(request: Request, { params }: RouteContext<{ id: string }>) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const raw = await readJson(request);
    const parsed = createManualAssignmentRequestSchema.parse(raw);

    const opensAt = new Date(parsed.opensAt);
    const closesAt = parsed.closesAt ? new Date(parsed.closesAt) : null;

    const dto = await createScheduledAssignment({
      teacherId: auth.teacher.id,
      classroomId,

      opensAt,
      closesAt,

      windowMinutes: parsed.windowMinutes ?? null,
      numQuestions: parsed.numQuestions ?? 12,

      mode: parsed.mode,
      type: parsed.type ?? 'TEST',
      targetKind: parsed.targetKind,

      operation: parsed.operation ?? null,
      durationMinutes: parsed.durationMinutes ?? null,

      studentIds: parsed.studentIds,
    });

    return jsonResponse({ assignment: dto }, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
