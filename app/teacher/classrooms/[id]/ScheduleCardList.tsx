// app/teacher/classrooms/[id]/components/ScheduleCardList.tsx
'use client';

import React, { useState } from 'react';
import type { Schedule, ScheduleInput } from './hooks';
import { ScheduleCard } from './ScheduleCard';

type ScheduleCardListProps = {
  schedules: Schedule[];
  savingSchedule: boolean;
  createNewSchedule: (input: ScheduleInput) => Promise<void>;
  updateScheduleById: (id: number, input: ScheduleInput) => Promise<void>;
  deleteScheduleById: (id: number) => Promise<void>;
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

export function ScheduleCardList({
  schedules,
  savingSchedule,
  createNewSchedule,
  updateScheduleById,
  deleteScheduleById,
}: ScheduleCardListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [draft, setDraft] = useState<ScheduleInput>({
    opensAtLocalTime: '09:00',
    windowMinutes: 30,
    isActive: true,
    days: ['Friday'],
  });

  // --- create form handlers ---

  const toggleDay = (day: string) => {
    setDraft((prev) => {
      const exists = prev.days.includes(day);
      return {
        ...prev,
        days: exists ? prev.days.filter((d) => d !== day) : [...prev.days, day],
      };
    });
  };

  const handleChangeDraftTime: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setDraft((prev) => ({
      ...prev,
      opensAtLocalTime: event.target.value,
    }));
  };

  const handleChangeDraftWindow: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = Number(event.target.value) || 0;
    setDraft((prev) => ({
      ...prev,
      windowMinutes: value,
    }));
  };

  const handleChangeDraftIsActive: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    setDraft((prev) => ({
      ...prev,
      isActive: event.target.checked,
    }));
  };

  const handleOpenCreate = () => {
    // reset draft to a friendly default whenever we open the form
    setDraft({
      opensAtLocalTime: '09:00',
      windowMinutes: 30,
      isActive: true,
      days: ['Friday'],
    });
    setCreateError(null);
    setIsCreating(true);
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setCreateError(null);
  };

  const handleSaveCreate = async () => {
    if (draft.days.length === 0) {
      setCreateError('Please select at least one day.');
      return;
    }

    try {
      setCreateError(null);
      await createNewSchedule(draft);
      setIsCreating(false);
    } catch (err) {
      console.error(err);
      setCreateError('Could not create schedule. Please try again.');
    }
  };

  return (
    <section className="space-y-4">
      {/* Header + New button */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-800">Weekly test schedules</h2>
        {!isCreating && (
          <button
            type="button"
            onClick={handleOpenCreate}
            disabled={savingSchedule}
            className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            + New schedule
          </button>
        )}
      </div>

      {/* New schedule form */}
      {isCreating && (
        <div className="rounded-xl border border-green-400 bg-green-50/60 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-800">Create new schedule</span>
          </div>

          {/* Days */}
          <div className="mb-3">
            <p className="mb-1 text-xs font-medium text-gray-700">Days of the week</p>
            <div className="flex flex-wrap gap-1">
              {ALL_DAYS.map((day) => {
                const isSelected = draft.days.includes(day);
                const baseClasses = 'rounded-full border px-2 py-0.5 text-xs';
                const activeClasses = 'border-green-600 bg-green-100 text-green-800';
                const inactiveClasses = 'border-gray-200 bg-white text-gray-500';

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`${baseClasses} ${isSelected ? activeClasses : inactiveClasses}`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time + window + active */}
          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-medium text-gray-700">Opens at (local time)</p>
              <input
                type="time"
                value={draft.opensAtLocalTime}
                onChange={handleChangeDraftTime}
                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
              />
            </div>

            <div>
              <p className="mb-1 text-xs font-medium text-gray-700">Window (minutes)</p>
              <input
                type="number"
                min={1}
                value={draft.windowMinutes}
                onChange={handleChangeDraftWindow}
                className="w-full rounded-lg border border-gray-200 px-2 py-1 text-sm"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={draft.isActive}
                  onChange={handleChangeDraftIsActive}
                />
                Active schedule
              </label>
            </div>
          </div>

          {/* Error */}
          {createError && <p className="mb-3 text-xs text-red-600">{createError}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelCreate}
              disabled={savingSchedule}
              className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveCreate}
              disabled={savingSchedule}
              className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {savingSchedule ? 'Saving…' : 'Save schedule'}
            </button>
          </div>
        </div>
      )}

      {/* Existing schedules list */}
      {schedules.length === 0 ? (
        <p className="text-xs text-gray-500">No schedules yet. Create one to start Friday tests.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              isSaving={savingSchedule}
              onUpdate={updateScheduleById}
              onDelete={deleteScheduleById}
            />
          ))}
        </div>
      )}
    </section>
  );
}
