// src/app/api/_shared/route-types.ts

type ParamsRecord = Record<string, string>;

export type RouteContext<TParams extends ParamsRecord = ParamsRecord> = {
  params: Promise<TParams>;
};

/* ------------------------------- Common routes ------------------------------ */

// /api/teacher/classrooms/[id]/...
export type ClassroomRouteContext = RouteContext<{ id: string }>;

// /api/teacher/classrooms/[id]/students/[studentId]
export type ClassroomStudentRouteContext = RouteContext<{ id: string; studentId: string }>;

// /api/teacher/classrooms/[id]/students/[studentId]/progress
export type TeacherStudentProgressRouteContext = RouteContext<{ id: string; studentId: string }>;

// /api/student/attempts/[attemptId]
export type StudentAttemptRouteContext = RouteContext<{ attemptId: string }>;

// /api/teacher/classrooms/[id]/assignments/[assignmentId]
export type TeacherAssignmentRouteContext = RouteContext<{ id: string; assignmentId: string }>;

// /api/teacher/classrooms/[id]/assignments/[assignmentId]/attempts/[attemptId]
export type TeacherAssignmentAttemptRouteContext = RouteContext<{
  id: string;
  assignmentId: string;
  attemptId: string;
}>;

// routes with no dynamic params
export type EmptyRouteContext = RouteContext<Record<string, never>>;
