import { z } from 'zod';
import {
  updateClassroomStudentById,
  deleteClassroomStudentById,
  getProgressionSnapshot,
  placeStudentAtDomainFull,
} from '@/core';
import { DOMAIN_CODES } from '@/types/domain';
import {
  handleApiError,
  readJson,
  type RouteContext,
  getTeacherClassroomStudentParams,
} from '@/app/api/_shared';
import { jsonResponse } from '@/utils/http';

const updateStudentSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  domain: z.enum(DOMAIN_CODES).optional(),
  level: z.coerce.number().int().min(0).max(100).optional(),
});

type Ctx = RouteContext<{ id: string; studentId: string }>;

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const ctx = await getTeacherClassroomStudentParams(params);
    if (!ctx.ok) return ctx.response;

    const body = await readJson(request);
    const input = updateStudentSchema.parse(body);

    const snapshot = await getProgressionSnapshot(ctx.classroomId);

    const student = await updateClassroomStudentById({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      studentId: ctx.studentIdNum,
      input: { name: input.name, username: input.username },
    });

    if (input.domain && input.level !== undefined) {
      await placeStudentAtDomainFull({
        teacherId: ctx.teacher.id,
        classroomId: ctx.classroomId,
        studentId: ctx.studentIdNum,
        domain: input.domain,
        level: input.level,
      });
    } else if (input.level !== undefined) {
      // level-only: place at first enabled domain
      const primaryDomain = snapshot.enabledDomains[0];
      if (primaryDomain) {
        await placeStudentAtDomainFull({
          teacherId: ctx.teacher.id,
          classroomId: ctx.classroomId,
          studentId: ctx.studentIdNum,
          domain: primaryDomain,
          level: input.level,
        });
      }
    }

    return jsonResponse({ student }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const ctx = await getTeacherClassroomStudentParams(params);
    if (!ctx.ok) return ctx.response;

    await deleteClassroomStudentById({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      studentId: ctx.studentIdNum,
    });

    return new Response(null, { status: 204 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
