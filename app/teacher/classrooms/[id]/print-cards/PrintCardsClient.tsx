// app/teacher/classrooms/[id]/print-cards/PrintCardsClient.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { TeacherNav } from 'components/TeacherNav';

type SetupCodeRow = {
  studentId: number;
  username: string;
  setupCode: string;
  expiresAt?: string;
  name?: string;
};

export default function PrintCardsClient({ classroomId }: { classroomId: number }) {
  const [rows, setRows] = useState<SetupCodeRow[]>([]);
  const [classroomName, setClassroomName] = useState<string>('Classroom');

  useEffect(() => {
    if (!Number.isFinite(classroomId) || classroomId <= 0) return;

    // 1) Load setup codes (one-time, stored in sessionStorage)
    try {
      const raw = sessionStorage.getItem(`lm_setupCodes_${classroomId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        const codes = Array.isArray(parsed?.setupCodes)
          ? parsed.setupCodes
          : Array.isArray(parsed)
            ? parsed
            : null;

        if (codes) setRows(codes as SetupCodeRow[]);
      }
    } catch {
      setRows([]);
    }

    // 2) Load classroom name
    fetch(`/api/classrooms/${classroomId}/roster`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) return null;
        return data;
      })
      .then((data) => {
        const name = typeof data?.classroom?.name === 'string' ? data.classroom.name : null;
        if (name) setClassroomName(name);
      })
      .catch(() => {});
  }, [classroomId]);

  const activateUrl = useMemo(() => `/student/activate`, []);

  return (
    <>
      <TeacherNav classroom={{ id: classroomId, name: classroomName }} />

      <main className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 print:hidden">
          <div>
            <h1 className="text-xl font-semibold">Printable login cards</h1>
            <p className="text-sm text-gray-600">
              Hand one card to each student. Each setup code is one-time use.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Print
          </button>
        </div>

        {rows.length === 0 ? (
          <div className="rounded border border-gray-200 p-4 text-sm text-gray-700">
            No setup codes found. Add students (bulk add) to generate new setup codes.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <div
                key={`${r.studentId}-${r.username}`}
                className="rounded-xl border border-gray-300 p-4 text-sm"
              >
                <div className="text-xs text-gray-500">LearnMetrics</div>

                {r.name ? (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">Student</div>
                    <div className="text-sm font-semibold">{r.name}</div>
                  </div>
                ) : null}

                <div className="mt-2">
                  <div className="text-xs text-gray-500">Username</div>
                  <div className="font-mono text-base font-semibold">{r.username}</div>
                </div>

                <div className="mt-2">
                  <div className="text-xs text-gray-500">Setup code (one-time)</div>
                  <div className="font-mono text-lg font-bold tracking-widest">{r.setupCode}</div>
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  Go to <span className="font-mono">{activateUrl}</span> to set your password.
                </div>

                {r.expiresAt ? (
                  <div className="mt-2 text-[11px] text-gray-500">
                    Expires: {new Date(r.expiresAt).toLocaleString()}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
