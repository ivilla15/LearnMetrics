import type { AssignmentDTO } from '../dtos';

export async function createFridayAssignment(params: {
  classroomId: string;
  fridayDate?: string;
  opensAtLocalTime?: string;
  windowMinutes?: number;
}): Promise<AssignmentDTO> {
  // 1. Compute next Friday (if not given) and PT→UTC window.
  // 2. Check if assignment already exists for that classroom/date window.
  // 3. If exists, return existing { wasCreated: false }.
  // 4. Else create a new assignment, return { wasCreated: true }.
}
