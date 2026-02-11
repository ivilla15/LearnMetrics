'use client';

import * as React from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { Modal, Button, HelpText, Pill } from '@/components';
import type { CalendarItemRow } from '@/types';
import { getAssignment, toIso } from '@/utils';

export function AssignmentDetailsModal(props: {
  open: boolean;
  onClose: () => void;

  item: CalendarItemRow | null;
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

  const selectedAssignment = getAssignment(item);

  const title = !item
    ? 'Assignment'
    : proj
      ? 'Upcoming scheduled test'
      : `Assignment ${selectedAssignment?.assignmentId ?? '—'}`;

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
            ) : selectedAssignment?.scheduleId && selectedAssignment?.runDate ? (
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
            {Pill(item.assignmentMode, 'muted')}
            {Pill(item.kind, 'muted')}
            {Pill(`${item.numQuestions} Q`, 'muted')}
            {Pill(item.windowMinutes ? `${item.windowMinutes} min` : 'No limit', 'muted')}
          </div>

          <div className="text-sm text-[hsl(var(--muted-fg))]">
            Opens:{' '}
            <span className="text-[hsl(var(--fg))] font-medium">
              {formatInTimeZone(toIso(item.opensAt), tz, 'MMM d, h:mm a')}
            </span>
            {' · '}
            Closes:{' '}
            <span className="text-[hsl(var(--fg))] font-medium">
              {formatInTimeZone(toIso(item.closesAt), tz, 'MMM d, h:mm a')}
            </span>
          </div>

          {selectedAssignment?.stats ? (
            <div className="flex flex-wrap gap-2">
              {Pill(
                `Attempted: ${selectedAssignment.stats.attemptedCount}/${selectedAssignment.stats.totalStudents}`,
                'muted',
              )}
              {Pill(`Mastery: ${selectedAssignment.stats.masteryRate}%`, 'success')}
              {Pill(`Avg: ${selectedAssignment.stats.avgPercent}%`, 'muted')}
            </div>
          ) : null}

          {proj ? (
            <HelpText>
              This is an upcoming projected test. Editing + saving will create the real assignment.
            </HelpText>
          ) : (
            <HelpText>
              Editing/deleting is blocked once an assignment has attempts, and after the close time.
            </HelpText>
          )}
        </div>
      )}
    </Modal>
  );
}
