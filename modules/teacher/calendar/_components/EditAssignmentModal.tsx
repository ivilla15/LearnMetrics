'use client';

import * as React from 'react';
import { Modal, Button, HelpText } from '@/components';
import type { AssignmentTargetKind } from '@/types';

export function EditAssignmentModal(props: {
  open: boolean;
  onClose: () => void;

  tz: string;
  isProjection: boolean;

  targetKind: AssignmentTargetKind;

  saving: boolean;
  canManageAssignments: boolean;

  dateValue: string;
  timeValue: string;

  windowMinutesValue: string;
  numQuestionsValue: string;

  durationMinutesValue: string;

  onChangeDate: (v: string) => void;
  onChangeTime: (v: string) => void;

  onChangeWindowMinutes: (v: string) => void;
  onChangeNumQuestions: (v: string) => void;

  onChangeDurationMinutes: (v: string) => void;

  onSave: () => void;
}) {
  const {
    open,
    onClose,
    tz,
    isProjection,
    saving,
    canManageAssignments,
    dateValue,
    timeValue,
    windowMinutesValue,
    numQuestionsValue,
    onChangeDate,
    onChangeTime,
    onChangeWindowMinutes,
    onChangeNumQuestions,
    targetKind,
    durationMinutesValue,
    onChangeDurationMinutes,
    onSave,
  } = props;

  const isPracticeTime = targetKind === 'PRACTICE_TIME';
  const inputsDisabled = saving || !canManageAssignments;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isProjection ? 'Edit upcoming test' : 'Edit assignment'}
      description={`Times are in ${tz}.`}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {canManageAssignments ? 'Cancel' : 'Close'}
          </Button>

          {canManageAssignments ? (
            <Button
              variant="primary"
              onClick={() => {
                if (!canManageAssignments) return;
                onSave();
              }}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          ) : null}
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Date</label>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => onChangeDate(e.target.value)}
              disabled={inputsDisabled}
              className="h-10 w-full rounded-xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-[hsl(var(--fg))]">Time</label>
            <input
              type="time"
              value={timeValue}
              onChange={(e) => onChangeTime(e.target.value)}
              disabled={inputsDisabled}
              className="h-10 w-full rounded-xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          {isPracticeTime ? (
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[hsl(var(--fg))]">Duration minutes</label>
              <input
                inputMode="numeric"
                value={durationMinutesValue}
                onChange={(e) => onChangeDurationMinutes(e.target.value)}
                placeholder="10"
                disabled={inputsDisabled}
                className="h-10 w-full rounded-xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium text-[hsl(var(--fg))]">Window minutes</label>
                <input
                  inputMode="numeric"
                  value={windowMinutesValue}
                  onChange={(e) => onChangeWindowMinutes(e.target.value)}
                  placeholder="4"
                  disabled={inputsDisabled}
                  className="h-10 w-full rounded-xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-[hsl(var(--fg))]">
                  Number of questions
                </label>
                <input
                  inputMode="numeric"
                  value={numQuestionsValue}
                  onChange={(e) => onChangeNumQuestions(e.target.value)}
                  placeholder="12"
                  disabled={inputsDisabled}
                  className="h-10 w-full rounded-xl border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </>
          )}
        </div>

        <HelpText>
          {!canManageAssignments
            ? 'You can view assignment timing details here, but only teachers can edit them.'
            : isProjection
              ? 'Saving will create the real assignment for this schedule run.'
              : 'Editing is blocked once an assignment has attempts, and after the close time.'}
        </HelpText>
      </div>
    </Modal>
  );
}
