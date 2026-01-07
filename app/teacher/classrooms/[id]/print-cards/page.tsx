// app/teacher/classrooms/[id]/print-cards/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { TeacherNav } from 'components/TeacherNav';

type SetupCodeRow = {
  studentId?: number;
  username: string;
  setupCode: string;
  expiresAt?: string;
  name?: string;
};

type Props = {
  params: { id: string };
};

export default function PrintCardsPage({ params }: Props) {
  const classroomId = Number(params.id);

  const [rows, setRows] = useState<SetupCodeRow[]>([]);
  const [classroomName, setClassroomName] = useState<string>('Classroom');

  useEffect(() => {
    if (!Number.isFinite(classroomId) || classroomId <= 0) return;

    // ---- Load setup codes (one-time, from sessionStorage) ----
    try {
      const raw = sessionStorage.getItem(`lm_setupCodes_${classroomId}`);
      if (raw) {
        const parsed = JSON.parse(raw);

        // Support multiple historical shapes:
        // 1) { setupCodes: [...] }
        // 2) { students: [...], setupCodes: [...] }
        // 3) [...]
        const candidate = Array.isArray(parsed?.setupCodes)
          ? parsed.setupCodes
          : Array.isArray(parsed)
            ? parsed
            : null;

        const cleaned = Array.isArray(candidate)
          ? (candidate as SetupCodeRow[])
              .filter(
                (r) =>
                  r &&
                  typeof r.username === 'string' &&
                  typeof r.setupCode === 'string' &&
                  r.username.trim().length > 0 &&
                  r.setupCode.trim().length > 0,
              )
              // Optional: drop expired codes if expiresAt exists
              .filter((r) => {
                if (!r.expiresAt) return true;
                const t = Date.parse(r.expiresAt);
                return Number.isFinite(t) ? t > Date.now() : true;
              })
          : [];

        setRows(cleaned);
      }
    } catch {
      setRows([]);
    }

    // ---- Load classroom name (teacher-authenticated) ----
    fetch(`/api/classrooms/${classroomId}/roster`, {
      credentials: 'include',
    })
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

  function clearStoredCodes() {
    try {
      sessionStorage.removeItem(`lm_setupCodes_${classroomId}`);
    } catch {
      // ignore
    }
    setRows([]);
  }

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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Print
            </button>

            {rows.length > 0 && (
              <button
                type="button"
                onClick={clearStoredCodes}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear codes
              </button>
            )}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="rounded border border-gray-200 p-4 text-sm text-gray-700">
            No setup codes found. Add students (bulk add) or reset access to generate new setup
            codes.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((r, idx) => (
              <div
                key={`${r.username}-${idx}`}
                className="rounded-xl border border-gray-300 p-4 text-sm"
              >
                <div className="text-xs text-gray-500">LearnMetrics</div>

                {r.name && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">Student</div>
                    <div className="text-sm font-semibold">{r.name}</div>
                  </div>
                )}

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

                {r.expiresAt && (
                  <div className="mt-2 text-[11px] text-gray-500">
                    Expires: {new Date(r.expiresAt).toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
