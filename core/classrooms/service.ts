import type { RosterDTO } from '../dtos';

export async function getRosterWithLastAttempt(classroomId: string): Promise<RosterDTO> {
  // 1. Confirm classroom exists.
  // 2. Fetch students in classroom.
  // 3. For each, fetch their latest attempt.
  // 4. Compute percent and wasMastery.
  // 5. Return aggregated RosterDTO.
}
