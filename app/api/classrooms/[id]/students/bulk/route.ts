import { z } from 'zod';

import {
  buildStudentsGate,
  bulkCreateClassroomStudents,
  getTeacherEntitlementAccessState,
  requireTeacher,
} from '@/core';
import { prisma } from '@/data/prisma';

import { classroomIdParamSchema } from '@/validation';
import { bulkAddStudentsSchema } from '@/validation/teacher/bulk-students';

import { errorResponse, jsonResponse } from '@/utils/http';
import { handleApiError, readJson, type RouteContext } from '@/app';

import type { DomainCode } from '@/types/domain';
import type { BulkAddStudentInputDTO } from '@/types/api/teacherStudents';

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const body = await readJson(request);
    const parsed = bulkAddStudentsSchema.parse(body);

    const defaultStartingDomain = parsed.defaultStartingDomain;
    const defaultStartingLevel = parsed.defaultStartingLevel;
    const defaultLevel = parsed.defaultLevel ?? 1;

    const studentsToCreate: BulkAddStudentInputDTO[] = parsed.students.map((s) => {
      const resolvedLevel = s.startingLevel ?? s.level ?? defaultStartingLevel ?? defaultLevel;
      const resolvedDomain: DomainCode | undefined = s.startingDomain ?? defaultStartingDomain;

      return {
        firstName: s.firstName,
        lastName: s.lastName,
        username: s.username,
        startingDomain: resolvedDomain,
        startingLevel: resolvedLevel,
      };
    });

    const access = await getTeacherEntitlementAccessState(auth.teacher.id);
    const currentStudentCount = await prisma.student.count({
      where: { classroomId },
    });

    const gate = buildStudentsGate({
      access,
      currentStudentCount,
      incomingStudentCount: studentsToCreate.length,
    });

    if (!gate.ok) {
      return errorResponse(gate.message, 402);
    }

    const result = await bulkCreateClassroomStudents({
      teacherId: auth.teacher.id,
      classroomId,
      students: studentsToCreate,
    });

    return jsonResponse(result, 201);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return errorResponse('Invalid request body', 400);
    return handleApiError(err);
  }
}
