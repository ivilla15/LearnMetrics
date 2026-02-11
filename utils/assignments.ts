import { CalendarItemRow, CalendarAssignmentDTO } from '@/types';
import { isProjection } from './calendar';

export function getAssignment(selected: CalendarItemRow | null): CalendarAssignmentDTO | null {
  if (!selected) return null;
  return isProjection(selected) ? null : selected;
}
