// app/api/classrooms/[id]/schedule/route.ts
import { requireTeacher } from '@/core/auth/requireTeacher';
import {
  upsertClassroomSchedule,
  getClassroomScheduleForTeacher,
  createAdditionalClassroomSchedule,
} from '@/core/schedules/service';
import { upsertScheduleSchema } from '@/validation/assignmentSchedules.schema';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError, ConflictError } from '@/core/errors';
import { ZodError } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

function handleError(err: unknown): Response {
  if (err instanceof ZodError) return errorResponse('Invalid request body', 400);
  if (err instanceof NotFoundError) return errorResponse(err.message, 404);
  if (err instanceof ConflictError) return errorResponse(err.message, 409);
  return errorResponse('Internal server error', 500);
}

// Get the *primary* schedule (for backwards compatibility)
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);
    const teacher = auth.teacher;

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const schedule = await getClassroomScheduleForTeacher({
      teacherId: teacher.id,
      classroomId,
    });

    return jsonResponse({ schedule }, 200);
  } catch (err) {
    return handleError(err);
  }
}

// Upsert the existing primary schedule (used by "Edit schedule")
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);
    const teacher = auth.teacher;
    const body = await request.json();

    // ✅ input now includes numQuestions (via your zod schema default(12))
    const input = upsertScheduleSchema.parse(body);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const schedule = await upsertClassroomSchedule({
      teacherId: teacher.id,
      classroomId,
      input,
    });

    return jsonResponse({ schedule }, 200);
  } catch (err) {
    return handleError(err);
  }
}

// Create an additional schedule row (used by "Create new weekly test schedule")
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);
    const teacher = auth.teacher;
    const body = await request.json();

    // ✅ input includes numQuestions
    const input = upsertScheduleSchema.parse(body);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const schedule = await createAdditionalClassroomSchedule({
      teacherId: teacher.id,
      classroomId,
      input,
    });

    return jsonResponse({ schedule }, 201);
  } catch (err) {
    return handleError(err);
  }
}
