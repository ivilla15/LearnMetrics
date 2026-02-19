import {
  updateClassroomStudentById,
  deleteClassroomStudentById,
  setTeacherStudentProgressRows,
  getProgressionSnapshot,
} from '@/core';
import { jsonResponse } from '@/utils';
import { handleApiError, type ClassroomStudentRouteContext, readJson } from '@/app';
import { z } from 'zod';

import { getTeacherClassroomAndStudentId } from '@/app/api/_shared/teacherStudentParams';
import { distributeLevelAcrossOperations } from '@/core/progression/leveling.service';

const updateStudentSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  level: z.number().int().min(1).max(100),
});

export async function PATCH(request: Request, { params }: ClassroomStudentRouteContext) {
  try {
    const ctx = await getTeacherClassroomAndStudentId(params);
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

export async function DELETE(_request: Request, { params }: ClassroomStudentRouteContext) {
  try {
    const ctx = await getTeacherClassroomAndStudentId(params);
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
