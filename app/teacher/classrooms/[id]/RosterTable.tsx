// app/teacher/classrooms/[id]/RosterTable.tsx
'use client';

import type { StudentRow } from './hooks';

type Props = {
  students: StudentRow[];
};

export default function RosterTable({ students }: Props) {
  if (students.length === 0) {
    return <p className="text-sm text-gray-500">No students in this classroom yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-xs uppercase text-gray-500">
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Username</th>
            <th className="px-3 py-2">Level</th>
            <th className="px-3 py-2">Last %</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Completed at</th>
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const a = s.lastAttempt;
            const hasAttempt = !!a;

            const status = !hasAttempt
              ? 'No attempt yet'
              : a.wasMastery
                ? 'Mastered'
                : 'In progress';

            const percent = hasAttempt ? `${a.percent}%` : '—';
            const completedAt = hasAttempt ? new Date(a.completedAt).toLocaleString() : '—';

            return (
              <tr key={s.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium text-gray-900">{s.name}</td>
                <td className="px-3 py-2 text-gray-600">{s.username}</td>
                <td className="px-3 py-2 text-gray-600">{s.level}</td>
                <td className="px-3 py-2">{percent}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      status === 'Mastered'
                        ? 'rounded-full bg-green-50 px-2 py-0.5 text-xs text-green-700'
                        : status === 'In progress'
                          ? 'rounded-full bg-yellow-50 px-2 py-0.5 text-xs text-yellow-700'
                          : 'rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-600'
                    }
                  >
                    {status}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-500 text-xs">{completedAt}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
