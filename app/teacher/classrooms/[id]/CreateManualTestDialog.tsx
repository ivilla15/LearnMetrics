// app/teacher/classrooms/[id]/CreateManualTestDialog.tsx
'use client';

import { useEffect, useState } from 'react';

type Props = {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  onCreate: (input: { date: string; time: string; windowMinutes: number }) => Promise<void>;
};

export function CreateManualTestDialog({ open, busy, onClose, onCreate }: Props) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('08:00');
  const [windowMinutes, setWindowMinutes] = useState(4);

  // reset fields whenever dialog opens
  useEffect(() => {
    if (!open) return;
    setDate('');
    setTime('08:00');
    setWindowMinutes(4);
  }, [open]);

  async function handleSubmit() {
    if (!date) return;
    await onCreate({ date, time, windowMinutes });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow">
        <div className="mb-3">
          <h3 className="text-base font-semibold">Create single test</h3>
          <p className="text-xs text-gray-500">Pick an exact date, time, and duration.</p>
        </div>

        <div className="space-y-3">
          <label className="block">
            <div className="mb-1 text-xs font-medium text-gray-700">Date</div>
            <input
              type="date"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={busy}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-medium text-gray-700">Time</div>
            <input
              type="time"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={busy}
            />
          </label>

          <label className="block">
            <div className="mb-1 text-xs font-medium text-gray-700">Duration (minutes)</div>
            <input
              type="number"
              min={1}
              max={60}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              value={windowMinutes}
              onChange={(e) => setWindowMinutes(Number(e.target.value))}
              disabled={busy}
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-lg px-3 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>

          <button
            type="button"
            className="rounded-lg bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={handleSubmit}
            disabled={busy || !date}
          >
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
