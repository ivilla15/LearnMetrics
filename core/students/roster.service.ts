import * as StudentsRepo from '@/data/students.repo';

export async function getClassroomRosterWithLatestAttempt(classroomId: number) {
  return StudentsRepo.findStudentsWithLatestAttempt(classroomId);
}
