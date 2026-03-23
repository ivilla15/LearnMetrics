import type { AssignmentTargetKind, AssignmentType, CalendarItemRowDTO } from '@/types';
import { formatAssignmentType } from '@/types';

export function formatCalendarTypeLabel(params: {
  targetKind: AssignmentTargetKind;
  type: AssignmentType | null;
}) {
  if (params.targetKind === 'PRACTICE_TIME') return 'Practice time';
  return params.type ? formatAssignmentType(params.type) : 'Assignment';
}

export function formatCalendarTargetLine(params: {
  targetKind: AssignmentTargetKind;
  numQuestions: number | null;
  durationMinutes: number | null;
}) {
  if (params.targetKind === 'PRACTICE_TIME') {
    return `${params.durationMinutes ?? 0} minutes`;
  }

  return `${params.numQuestions ?? 0} questions`;
}

export function formatCalendarItemTypeLabel(item: CalendarItemRowDTO) {
  return formatCalendarTypeLabel({
    targetKind: item.targetKind,
    type: item.type ?? null,
  });
}

export function formatCalendarItemTargetLine(item: CalendarItemRowDTO) {
  return formatCalendarTargetLine({
    targetKind: item.targetKind,
    numQuestions: 'numQuestions' in item ? (item.numQuestions ?? null) : null,
    durationMinutes: 'durationMinutes' in item ? (item.durationMinutes ?? null) : null,
  });
}
