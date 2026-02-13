import { requireTeacher } from '@/core';
import { classroomIdParamSchema, upsertProgressionPolicySchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, readJson, RouteContext } from '@/app';
import { prisma } from '@/data/prisma';

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    // Ownership
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, teacherId: true, name: true, timeZone: true },
    });
    if (!classroom) return errorResponse('Classroom not found', 404);
    if (classroom.teacherId !== auth.teacher.id) return errorResponse('Not allowed', 403);

    // Get or create policy (lazy ensure)
    const existing = await prisma.classroomProgressionPolicy.findUnique({
      where: { classroomId },
    });

    const policy =
      existing ??
      (await prisma.classroomProgressionPolicy.create({
        data: {
          classroomId,
          enabledOperations: ['MUL'],
          maxNumber: 12,
          allowDecimals: false,
          allowFractions: false,
          divisionIntegersOnly: true,
        },
      }));

    return jsonResponse({ policy }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    // Ownership
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, teacherId: true },
    });
    if (!classroom) return errorResponse('Classroom not found', 404);
    if (classroom.teacherId !== auth.teacher.id) return errorResponse('Not allowed', 403);

    const body = await readJson(request);
    const input = upsertProgressionPolicySchema.parse(body);

    // Ensure exists then update (upsert keeps it simple)
    const policy = await prisma.classroomProgressionPolicy.upsert({
      where: { classroomId },
      create: {
        classroomId,
        enabledOperations: input.enabledOperations,
        maxNumber: input.maxNumber,
        allowDecimals: input.allowDecimals,
        allowFractions: input.allowFractions,
        divisionIntegersOnly: input.divisionIntegersOnly,
      },
      update: {
        enabledOperations: input.enabledOperations,
        maxNumber: input.maxNumber,
        allowDecimals: input.allowDecimals,
        allowFractions: input.allowFractions,
        divisionIntegersOnly: input.divisionIntegersOnly,
      },
    });

    return jsonResponse({ policy }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}