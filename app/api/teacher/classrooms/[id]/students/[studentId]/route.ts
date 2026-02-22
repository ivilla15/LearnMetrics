import { z } from 'zod';
import {
  updateClassroomStudentById,
  deleteClassroomStudentById,
  setTeacherStudentProgressRows,
  getProgressionSnapshot,
  distributeLevelAcrossOperations,
} from '@/core';
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
  level: z.coerce.number().int().min(1).max(100),
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

    const operationOrder = snapshot.operationOrder.length
      ? snapshot.operationOrder
      : snapshot.enabledOperations;

    const levelsToWrite = distributeLevelAcrossOperations({
      operationOrder,
      primaryOp: snapshot.primaryOperation,
      maxNumber: snapshot.maxNumber,
      levelAmount: input.level,
    });

    if (levelsToWrite.length > 0) {
      await setTeacherStudentProgressRows({
        teacherId: ctx.teacher.id,
        classroomId: ctx.classroomId,
        studentId: ctx.studentIdNum,
        levels: levelsToWrite,
      });
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
