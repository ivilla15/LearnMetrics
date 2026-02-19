import { requireTeacher, createScheduledAssignment } from '@/core';
import { classroomIdParamSchema, createManualAssignmentRequestSchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, readJson, type RouteContext } from '@/app';

function isValidDate(d: Date) {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const raw = await readJson(request);
    const parsed = createManualAssignmentRequestSchema.parse(raw);

    const opensAt = new Date(parsed.opensAt);
    const closesAt = new Date(parsed.closesAt);

    if (!isValidDate(opensAt) || !isValidDate(closesAt)) {
      return errorResponse('Invalid opensAt/closesAt', 400);
    }

    if (closesAt <= opensAt) {
      return errorResponse('closesAt must be after opensAt', 400);
    }

    const dto = await createScheduledAssignment({
      teacherId: auth.teacher.id,
      classroomId,
      opensAt,
      closesAt,
      windowMinutes: parsed.windowMinutes ?? 4,
      numQuestions: parsed.numQuestions ?? 12,
      mode: 'MANUAL',
      type: 'TEST',
      questionSetId: parsed.questionSetId ?? null,
      studentIds: parsed.studentIds,
    });

    return jsonResponse({ assignment: dto }, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
