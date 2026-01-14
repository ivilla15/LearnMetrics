import {
  requireTeacher,
  upsertClassroomSchedule,
  getClassroomScheduleForTeacher,
  createAdditionalClassroomSchedule,
} from '@/core';
import { upsertScheduleSchema, classroomIdParamSchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils/';
import { RouteContext, handleApiError, readJson } from '@/app';

async function getTeacherAndClassroomId(params: RouteContext['params']) {
  const auth = await requireTeacher();
  if (!auth.ok) return { ok: false as const, response: errorResponse(auth.error, auth.status) };

  const { id } = await params;
  const { id: classroomId } = classroomIdParamSchema.parse({ id });

  return { ok: true as const, teacher: auth.teacher, classroomId };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await getTeacherAndClassroomId(params);
    if (!ctx.ok) return ctx.response;

    const schedule = await getClassroomScheduleForTeacher({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
    });

    return jsonResponse({ schedule }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const ctx = await getTeacherAndClassroomId(params);
    if (!ctx.ok) return ctx.response;

    const body = await readJson(request);
    const input = upsertScheduleSchema.parse(body);

    const schedule = await upsertClassroomSchedule({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      input,
    });

    return jsonResponse({ schedule }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const ctx = await getTeacherAndClassroomId(params);
    if (!ctx.ok) return ctx.response;

    const body = await readJson(request);
    const input = upsertScheduleSchema.parse(body);

    const schedule = await createAdditionalClassroomSchedule({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      input,
    });

    return jsonResponse({ schedule }, 201);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
