'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { formatInTimeZone } from 'date-fns-tz';
import { Modal, Button, HelpText, Pill } from '@/components';
import type { AssignmentMode, CalendarItemRowDTO } from '@/types';
import {
  formatAssignmentMode,
  formatCalendarTargetLine,
  formatCalendarTypeLabel,
  formatOperation,
} from '@/types';
import { isProjection, toIso } from '@/utils/calendar';

function getStudentModeLabel(mode: AssignmentMode): string | null {
  if (mode === 'MAKEUP') return 'Makeup';
  return null;
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

  canManageAssignments: boolean;
  getDetailsUrl: (item: CalendarItemRowDTO) => string | null;
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
    canManageAssignments,
    getDetailsUrl,
  } = props;

  const router = useRouter();

  const title = !item
    ? 'Assignment'
    : (() => {
        const typeLabel = formatCalendarTypeLabel(item);

        if (proj) return typeLabel;

        if (item.kind === 'assignment') {
          return canManageAssignments ? `${typeLabel} #${item.assignmentId}` : typeLabel;
        }

        return typeLabel;
      })();
  const opensIso = item ? toIso(item.opensAt) : null;
  const closesIso = item && item.closesAt ? toIso(item.closesAt) : null;

  const modeLabel = item
    ? canManageAssignments
      ? formatAssignmentMode(item.mode) // teachers
      : getStudentModeLabel(item.mode) // students
    : null;
  const typeLabel = item ? formatCalendarTypeLabel(item) : '—';
  const opLabel = item?.operation ? formatOperation(item.operation) : null;

  const isPractice = item?.targetKind === 'PRACTICE_TIME';
  const stats = !item || proj || isProjection(item) || isPractice ? null : (item.stats ?? null);

  const canCancelOccurrence = !!item && (proj || (!!item.scheduleId && !!item.runDate));

  const detailsUrl = item ? getDetailsUrl(item) : null;

  const now = Date.now();

  const isOpenNow =
    !canManageAssignments &&
    !!opensIso &&
    !!closesIso &&
    new Date(opensIso).getTime() <= now &&
    now < new Date(closesIso).getTime();

  const primaryActionLabel = canManageAssignments
    ? 'View details'
    : isOpenNow
      ? item?.targetKind === 'PRACTICE_TIME'
        ? 'Open practice'
        : 'Open test'
      : 'View details';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description="Details and actions."
      size="lg"
      footer={
        item ? (
          <div className="flex justify-between gap-2">
            {/* LEFT: primary action */}
            {detailsUrl ? (
              <Button
                variant="primary"
                onClick={() => {
                  router.push(detailsUrl);
                }}
              >
                {primaryActionLabel}
              </Button>
            ) : (
              <div />
            )}

            {/* RIGHT: existing actions */}
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>

              {canManageAssignments ? (
                <>
                  <Button variant="secondary" onClick={onOpenEdit} disabled={isClosed}>
                    Edit
                  </Button>

                  {canCancelOccurrence ? (
                    <Button variant="destructive" onClick={() => void onCancelOccurrence()}>
                      Cancel
                    </Button>
                  ) : null}
                </>
              ) : null}
            </div>
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
            {modeLabel ? Pill(modeLabel, 'muted') : null}
            {Pill(formatCalendarTargetLine(item), 'muted')}
            {!isPractice
              ? Pill(item.windowMinutes ? `${item.windowMinutes} min window` : 'No window', 'muted')
              : null}
            {isPractice && item.requiredSets != null
              ? Pill(`${item.requiredSets} sets required`, 'muted')
              : null}
            {isPractice && item.minimumScorePercent != null
              ? Pill(`${item.minimumScorePercent}% min score`, 'muted')
              : null}
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

          {proj && canManageAssignments ? (
            <HelpText>
              This is a scheduled occurrence. Saving edits will create the real assignment.
            </HelpText>
          ) : canManageAssignments ? (
            <HelpText>
              Editing is blocked after the close time. Some changes may also be blocked once
              attempts exist.
            </HelpText>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
