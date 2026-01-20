// app/api/classrooms/[id]/assignments/manual/route.ts
import { requireTeacher, createScheduledAssignment } from '@/core';
import { classroomIdParamSchema, createManualAssignmentRequestSchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, readJson, type RouteContext } from '@/app';
import { assertTeacherOwnsClassroom } from '@/core/classrooms';

function isValidDate(d: Date) {
  return d instanceof Date && !Number.isNaN(d.getTime());
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    // 0) Auth
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    // 1) Params
    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    // 2) Ownership
    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    // 3) Body (shared helper)
    const raw = await readJson(request);

    // 4) Validate MANUAL payload
    const parsed = createManualAssignmentRequestSchema.parse(raw);

    const opensAt = new Date(parsed.opensAt);
    const closesAt = new Date(parsed.closesAt);

    if (!isValidDate(opensAt) || !isValidDate(closesAt)) {
      return errorResponse('Invalid opensAt/closesAt', 400);
    }
    if (closesAt <= opensAt) {
      return errorResponse('closesAt must be after opensAt', 400);
    }

    // 5) Create MANUAL assignment (targeted to selected students)
    const dto = await createScheduledAssignment({
      classroomId,
      opensAt,
      closesAt,
      windowMinutes: parsed.windowMinutes ?? 4,
      numQuestions: parsed.numQuestions ?? 12,
      assignmentMode: 'MANUAL',
      kind: 'SCHEDULED_TEST',
      questionSetId: parsed.questionSetId ?? null,
      studentIds: parsed.studentIds, // REQUIRED
    });

    return jsonResponse({ assignment: dto }, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
