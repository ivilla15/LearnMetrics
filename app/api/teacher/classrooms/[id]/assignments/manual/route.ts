import {
  buildAssignmentsGate,
  createScheduledAssignment,
  getTeacherEntitlementAccessState,
} from '@/core';
import { classroomIdParamSchema, createManualAssignmentRequestSchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, readJson, type RouteContext } from '@/app';
import { requireTeacher } from '@/core/auth';

export async function POST(req: Request, { params }: RouteContext<{ id: string }>) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const access = await getTeacherEntitlementAccessState(auth.teacher.id);
    const gate = buildAssignmentsGate({ access });

    if (!gate.ok) {
      return errorResponse(gate.message, 402);
    }

    const raw = await readJson(req);
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
      type: parsed.targetKind === 'PRACTICE_TIME' ? 'PRACTICE' : (parsed.type ?? 'TEST'),
      targetKind: parsed.targetKind,

      durationMinutes: parsed.durationMinutes ?? null,

      requiredSets: parsed.requiredSets ?? null,
      minimumScorePercent: parsed.minimumScorePercent ?? null,

      studentIds: parsed.studentIds,
    });

    return jsonResponse({ assignment: dto }, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
