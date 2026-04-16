import {
  getProgressionSnapshot,
  getTeacherStudentProgressRows,
  placeStudentAtDomainFull,
  requireTeacher,
  setTeacherStudentProgressRows,
} from '@/core';
import { DOMAIN_CODES, type DomainCode } from '@/types/domain';
import type { StudentProgressLiteDTO } from '@/types/api/progression';
import {
  handleApiError,
  readJson,
  RouteContext,
  getTeacherClassroomStudentParams,
} from '@/app/api/_shared';
import { jsonResponse, errorResponse } from '@/utils/http';
import { z } from 'zod';

const domainPlacementSchema = z.object({
  domain: z
    .string()
    .refine((v) => (DOMAIN_CODES as readonly string[]).includes(v), 'Invalid domain')
    .transform((v) => v as DomainCode),
  level: z.coerce.number().int().min(0).max(100),
});

const batchUpdateSchema = z.object({
  levels: z
    .array(
      z.object({
        domain: z.string().refine((v) => (DOMAIN_CODES as readonly string[]).includes(v), 'Invalid domain'),
        level: z.coerce.number().int().min(0).max(100),
      }),
    )
    .min(1),
});

export async function GET(
  _request: Request,
  { params }: RouteContext<{ id: string; studentId: string }>,
) {
  try {
    const ctx = await getTeacherClassroomStudentParams(params);
    if (!ctx.ok) return ctx.response;

    const policy = await getProgressionSnapshot(ctx.classroomId);

    const progress = await getTeacherStudentProgressRows({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      studentId: ctx.studentIdNum,
    });

    return jsonResponse({ studentId: ctx.studentIdNum, policy, progress }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext<{ id: string; studentId: string }>,
) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const ctx = await getTeacherClassroomStudentParams(params);
    if (!ctx.ok) return ctx.response;

    const body = await readJson(request);
    const policy = await getProgressionSnapshot(ctx.classroomId);

    let progress: StudentProgressLiteDTO[];

    const placement = domainPlacementSchema.safeParse(body);
    if (placement.success) {
      progress = await placeStudentAtDomainFull({
        teacherId: ctx.teacher.id,
        classroomId: ctx.classroomId,
        studentId: ctx.studentIdNum,
        domain: placement.data.domain,
        level: placement.data.level,
      });
    } else {
      const batch = batchUpdateSchema.parse(body);
      progress = await setTeacherStudentProgressRows({
        teacherId: ctx.teacher.id,
        classroomId: ctx.classroomId,
        studentId: ctx.studentIdNum,
        levels: batch.levels as StudentProgressLiteDTO[],
      });
    }

    return jsonResponse({ studentId: ctx.studentIdNum, policy, progress }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
