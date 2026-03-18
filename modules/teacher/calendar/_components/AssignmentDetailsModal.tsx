'use client';

import * as React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Modal, Button, HelpText, Pill } from '@/components';
import type { CalendarItemRowDTO } from '@/types';
import { formatAssignmentMode, formatAssignmentType, formatOperation } from '@/types';
import { isProjection, toIso } from '@/utils/calendar';

function formatTargetLine(item: CalendarItemRowDTO) {
  if (isProjection(item)) {
    if (item.targetKind === 'PRACTICE_TIME') return `${item.durationMinutes ?? 0} minutes`;
    return `${item.numQuestions ?? 0} questions`;
  }

  if (item.targetKind === 'PRACTICE_TIME') return `${item.durationMinutes ?? 0} minutes`;
  return `${item.numQuestions ?? 0} questions`;
}

function formatTypeLabel(item: CalendarItemRowDTO) {
  if (isProjection(item)) {
    if (item.targetKind === 'PRACTICE_TIME') return 'Practice time';
    return item.type ? formatAssignmentType(item.type) : 'Assignment';
  }

  if (item.targetKind === 'PRACTICE_TIME') return 'Practice time';
  return formatAssignmentType(item.type);
}

export function AssignmentDetailsModal(props: {
  open: boolean;
  onClose: () => void;

  item: CalendarItemRowDTO | null;
  tz: string;

  isProjection: boolean;
  isClosed: boolean;

  onOpenEdit: () => void;
  onCancelOccurrence: () => Promise<void> | void;
}) {
  const {
    open,
    onClose,
    item,
    tz,
    isProjection: proj,
    isClosed,
    onOpenEdit,
    onCancelOccurrence,
  } = props;

  const title = !item
    ? 'Assignment'
    : proj
      ? 'Scheduled occurrence'
      : item.kind === 'assignment'
        ? `Assignment #${item.assignmentId}`
        : 'Scheduled occurrence';

  const opensIso = item ? toIso(item.opensAt) : null;
  const closesIso = item && item.closesAt ? toIso(item.closesAt) : null;

  const modeLabel = item ? formatAssignmentMode(item.mode) : '—';
  const typeLabel = item ? formatTypeLabel(item) : '—';
  const opLabel = item?.operation ? formatOperation(item.operation) : null;

  const stats = !item || proj || isProjection(item) ? null : (item.stats ?? null);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Details and actions."
      size="lg"
      footer={
        item ? (
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>

            <Button variant="secondary" onClick={onOpenEdit} disabled={isClosed}>
              Edit date/time
            </Button>

            {/* Cancel: projections always cancellable, real assignments only if schedule-backed */}
            {proj ? (
              <Button variant="destructive" onClick={() => void onCancelOccurrence()}>
                Cancel occurrence
              </Button>
            ) : item.scheduleId && item.runDate ? (
              <Button variant="destructive" onClick={() => void onCancelOccurrence()}>
                Cancel occurrence
              </Button>
            ) : null}
          </div>
        ) : null
      }
    >
      {!item ? (
        <div className="text-sm text-[hsl(var(--muted-fg))]">No selection.</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {Pill(typeLabel, 'muted')}
            {Pill(modeLabel, 'muted')}
            {Pill(formatTargetLine(item), 'muted')}
            {Pill(item.windowMinutes ? `${item.windowMinutes} min window` : 'No window', 'muted')}
            {opLabel ? Pill(opLabel, 'muted') : null}
          </div>

          <div className="text-sm text-[hsl(var(--muted-fg))]">
            Opens:{' '}
            <span className="text-[hsl(var(--fg))] font-medium">
              {opensIso ? formatInTimeZone(opensIso, tz, 'MMM d, h:mm a') : '—'}
            </span>
            {' · '}
            Closes:{' '}
            <span className="text-[hsl(var(--fg))] font-medium">
              {closesIso ? formatInTimeZone(closesIso, tz, 'MMM d, h:mm a') : '—'}
            </span>
          </div>

          {stats ? (
            <div className="flex flex-wrap gap-2">
              {Pill(`Attempted: ${stats.attemptedCount}/${stats.totalStudents}`, 'muted')}
              {stats.masteryRate == null ? null : Pill(`Mastery: ${stats.masteryRate}%`, 'success')}
              {stats.avgPercent == null ? null : Pill(`Avg: ${stats.avgPercent}%`, 'muted')}
            </div>
          ) : null}

          {proj ? (
            <HelpText>
              This is a scheduled occurrence. Saving edits will create the real assignment.
            </HelpText>
          ) : (
            <HelpText>
              Editing is blocked after the close time. Some changes may also be blocked once
              attempts exist.
            </HelpText>
          )}
        </div>
      )}
    </Modal>
  );
}
