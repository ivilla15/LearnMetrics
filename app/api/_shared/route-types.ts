// app/api/_shared/route-types.ts
export type RouteContext = { params: Promise<{ id: string }> };
export type ClassroomStudentRouteContext = { params: Promise<{ id: string; studentId: string }> };
export type RouteParams = {
  params: Promise<{ id: string; scheduleId: string }>;
};
export type ClassroomAssignmentRouteContext = {
  params: Promise<{ id: string; assignmentId: string }>;
};
