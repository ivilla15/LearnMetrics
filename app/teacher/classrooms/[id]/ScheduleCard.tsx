// app/teacher/classrooms/[id]/ScheduleCard.tsx
'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type Schedule = {
  id: number;
  classroomId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
  days: string[];
} | null;

type Props = {
  schedule: Schedule;
  loading?: boolean;
  saving?: boolean;
  onSave?: (input: {
    opensAtLocalTime: string;
    windowMinutes: number;
    isActive: boolean;
    days: string[];
  }) => Promise<void>;
};

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
type Day = (typeof ALL_DAYS)[number];

export function ScheduleCard({ schedule, loading, saving, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [opensAt, setOpensAt] = useState('08:00');
  const [windowMinutes, setWindowMinutes] = useState('4');
  const [isActive, setIsActive] = useState(true);
  const [days, setDays] = useState<string[]>(['Friday']);
  const [localError, setLocalError] = useState<string | null>(null);

  // whenever schedule changes, reset the form
  useEffect(() => {
    if (!schedule) {
      setOpensAt('08:00');
      setWindowMinutes('4');
      setIsActive(true);
      setDays(['Friday']);
      return;
    }

    setOpensAt(schedule.opensAtLocalTime || '08:00');
    setWindowMinutes(String(schedule.windowMinutes ?? 4));
    setIsActive(schedule.isActive);
    setDays(schedule.days && schedule.days.length > 0 ? schedule.days : ['Friday']);
  }, [schedule]);

  function toggleDay(day: Day) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!onSave) return;

    const win = Number(windowMinutes);

    if (!days.length) {
      setLocalError('Please choose at least one day.');
      return;
    }

    setLocalError(null);

    await onSave({
      opensAtLocalTime: opensAt,
      windowMinutes: Number.isFinite(win) && win > 0 ? win : 4,
      isActive,
      days,
    });

    setEditing(false);
  }

  return (
    <Card>
      <CardHeader title="Weekly test schedule" subtitle="When tests are generated" />

      {loading ? (
        <div className="px-4 pb-4">
          <LoadingSpinner label="Loading schedule..." />
        </div>
      ) : (
        <div className="px-4 pb-4 space-y-4 text-xs text-gray-700">
          {/* Summary */}
          <div className="space-y-1">
            <div>
              <span className="text-gray-500">Time:&nbsp;</span>
              <span>{schedule ? schedule.opensAtLocalTime : '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Window:&nbsp;</span>
              <span>{schedule ? `${schedule.windowMinutes} minutes` : '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Days:&nbsp;</span>
              <span>
                {schedule && schedule.days && schedule.days.length ? schedule.days.join(', ') : '—'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status:&nbsp;</span>
              <span className={schedule?.isActive ? 'text-emerald-700' : 'text-gray-500'}>
                {schedule?.isActive ? 'Active' : 'Paused'}
              </span>
            </div>
          </div>

          {/* Toggle edit */}
          {onSave && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="inline-flex items-center rounded bg-gray-800 px-3 py-1 text-[11px] font-medium text-white hover:bg-gray-700"
            >
              {schedule ? 'Edit schedule' : 'Set up schedule'}
            </button>
          )}

          {/* Edit form */}
          {editing && (
            <form onSubmit={handleSubmit} className="space-y-3 border-t border-gray-200 pt-3">
              {/* Time */}
              <div className="space-y-1">
                <label
                  htmlFor="schedule-opens-at"
                  className="block text-[11px] font-medium text-gray-600"
                >
                  Time (HH:mm)
                </label>
                <input
                  id="schedule-opens-at"
                  type="time"
                  value={opensAt}
                  onChange={(e) => setOpensAt(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                />
              </div>

              {/* Window */}
              <div className="space-y-1">
                <label
                  htmlFor="schedule-window-minutes"
                  className="block text-[11px] font-medium text-gray-600"
                >
                  Window (minutes)
                </label>
                <input
                  id="schedule-window-minutes"
                  type="number"
                  min={1}
                  max={60}
                  value={windowMinutes}
                  onChange={(e) => setWindowMinutes(e.target.value)}
                  className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-xs"
                />
              </div>

              <div className="space-y-1">
                <span className="block text-[11px] font-medium text-gray-600">Days</span>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => (
                    <label key={day} className="inline-flex items-center gap-1 text-[11px]">
                      <input
                        type="checkbox"
                        checked={days.includes(day)}
                        onChange={() => toggleDay(day)}
                      />
                      <span>{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>Schedule is active</span>
              </label>

              {localError && <p className="text-[11px] text-red-600">{localError}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center rounded bg-emerald-700 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save schedule'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center rounded border border-gray-300 px-3 py-1 text-[11px]"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </Card>
  );
}
