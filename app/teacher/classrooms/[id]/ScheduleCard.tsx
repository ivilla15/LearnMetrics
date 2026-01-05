// app/teacher/classrooms/[id]/components/ScheduleCard.tsx
'use client';

import React, { useMemo, useState } from 'react';
import type { Schedule, ScheduleInput } from './hooks';

type ScheduleCardProps = {
  schedule: Schedule;
  isSaving?: boolean;
  onUpdate: (id: number, input: ScheduleInput) => Promise<void> | void;
  onDelete: (id: number) => Promise<void> | void;
};

const ALL_DAYS: string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function ScheduleCard({
  schedule,
  isSaving = false,
  onUpdate,
  onDelete,
}: ScheduleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<ScheduleInput>({
    opensAtLocalTime: schedule.opensAtLocalTime,
    windowMinutes: schedule.windowMinutes,
    isActive: schedule.isActive,
    days: schedule.days ?? [],
    numQuestions: schedule.numQuestions,
  });

  const sortedDays = useMemo(
    () => [...(schedule.days ?? [])].sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b)),
    [schedule.days],
  );

  const displayDays = isEditing ? formValues.days : sortedDays;

  // --- field handlers ---

  const handleToggleDay = (day: string) => {
    setFormValues((prev) => {
      const exists = prev.days.includes(day);
      return {
        ...prev,
        days: exists ? prev.days.filter((d) => d !== day) : [...prev.days, day],
      };
    });
  };

  const handleChangeNumQuestions: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = Number(event.target.value) || 0;
    setFormValues((prev) => ({
      ...prev,
      numQuestions: value,
    }));
  };

  const handleChangeTime: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setFormValues((prev) => ({
      ...prev,
      opensAtLocalTime: event.target.value,
    }));
  };

  const handleChangeWindowMinutes: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = Number(event.target.value) || 0;
    setFormValues((prev) => ({
      ...prev,
      windowMinutes: value,
    }));
  };

  const handleChangeIsActive: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setFormValues((prev) => ({
      ...prev,
      isActive: event.target.checked,
    }));
  };

  // --- edit/save/delete ---

  const handleEditClick = () => {
    // Reset to latest schedule values when entering edit mode
    setFormValues({
      opensAtLocalTime: schedule.opensAtLocalTime,
      windowMinutes: schedule.windowMinutes,
      isActive: schedule.isActive,
      days: schedule.days ?? [],
      numQuestions: schedule.numQuestions,
    });
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    try {
      await onUpdate(schedule.id, formValues);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setError('Could not save changes. Please try again.');
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm('Delete this weekly test schedule? This cannot be undone.');
    if (!confirmed) return;

    setError(null);
    try {
      await onDelete(schedule.id);
      // parent removes from list
    } catch (err) {
      console.error(err);
      setError('Could not delete this schedule. Please try again.');
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        schedule.isActive ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-700">Weekly test schedule</span>
          <span className="text-xs text-gray-400">ID: {schedule.id}</span>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2">
            {schedule.isActive && (
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                Active
              </span>
            )}
          </div>
        )}
      </div>

      {/* Days */}
      <div className="mb-3">
        <p className="mb-1 text-xs font-medium text-gray-500">Days of the week</p>
        <div className="flex flex-wrap gap-1">
          {ALL_DAYS.map((day) => {
            const isSelected = displayDays.includes(day);
            if (!isEditing && !isSelected) return null;

            const baseClasses = 'rounded-full border px-2 py-0.5 text-xs';
            const activeClasses = 'border-blue-500 bg-blue-50 text-blue-700';
            const inactiveClasses = 'border-gray-200 bg-gray-50 text-gray-400';

            if (isEditing) {
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleToggleDay(day)}
                  className={`${baseClasses} ${isSelected ? activeClasses : inactiveClasses}`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            }

            return (
              <span key={day} className={`${baseClasses} ${activeClasses}`}>
                {day.slice(0, 3)}
              </span>
            );
          })}

          {!displayDays.length && !isEditing && (
            <span className="text-xs text-gray-400">No days configured</span>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="mb-3 grid grid-cols-2 gap-3 xl:grid-cols-2">
        {/* Opens at */}
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs font-medium text-gray-500 leading-snug">Opens at</p>

          {isEditing ? (
            <input
              type="time"
              value={formValues.opensAtLocalTime}
              onChange={handleChangeTime}
              className="mt-2 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
            />
          ) : (
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {schedule.opensAtLocalTime || 'Not set'}
            </p>
          )}

          <p className="mt-1 text-[11px] text-gray-400">Local time</p>
        </div>

        {/* Window minutes */}
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs font-medium text-gray-500 leading-snug">Window</p>

          {isEditing ? (
            <input
              type="number"
              min={1}
              value={formValues.windowMinutes}
              onChange={handleChangeWindowMinutes}
              className="mt-2 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
            />
          ) : (
            <p className="mt-2 text-sm font-semibold text-gray-900">{schedule.windowMinutes} min</p>
          )}

          <p className="mt-1 text-[11px] text-gray-400">Minutes</p>
        </div>

        {/* Questions */}
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs font-medium text-gray-500 leading-snug">Questions</p>

          {isEditing ? (
            <input
              type="number"
              min={1}
              max={60}
              value={formValues.numQuestions}
              onChange={(e) => {
                const value = Number(e.target.value) || 0;
                setFormValues((prev) => ({ ...prev, numQuestions: value }));
              }}
              className="mt-2 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
            />
          ) : (
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {schedule.numQuestions ?? 20}
            </p>
          )}

          <p className="mt-1 text-[11px] text-gray-400">Per test</p>
        </div>

        {/* Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-xs font-medium text-gray-500 leading-snug">Status</p>

          {isEditing ? (
            <label className="mt-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
              <input
                type="checkbox"
                checked={formValues.isActive}
                onChange={handleChangeIsActive}
              />
              Active
            </label>
          ) : (
            <p className="mt-2 text-sm font-semibold text-gray-900">
              {schedule.isActive ? 'Active' : 'Inactive'}
            </p>
          )}

          <p className="mt-1 text-[11px] text-gray-400">
            {schedule.isActive ? 'Used for auto tests' : 'Not used'}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && <p className="mb-3 text-xs text-red-600">{error}</p>}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={handleEditClick}
              disabled={isSaving}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Edit
            </button>
          </>
        )}
      </div>
    </div>
  );
}
