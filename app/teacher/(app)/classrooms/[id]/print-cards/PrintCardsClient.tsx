'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components';
import { SetupCodeRow } from '@/types/classroom';

export default function PrintCardsClient({ classroomId }: { classroomId: number }) {
  const [rows, setRows] = useState<SetupCodeRow[]>([]);
  const [classroomName, setClassroomName] = useState<string>('Classroom');

  useEffect(() => {
    if (!Number.isFinite(classroomId) || classroomId <= 0) return;

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

  const activateUrl = '/student/activate';

  return (
    <div className="space-y-6 p-6 print:p-0">
      <div className="lm-no-print flex items-start justify-between gap-4">
        <div>
          <div className="text-sm text-[hsl(var(--muted-fg))]">Classroom</div>
          <h1 className="text-2xl font-semibold text-[hsl(var(--fg))]">{classroomName}</h1>
          <p className="mt-1 text-sm text-[hsl(var(--muted-fg))]">
            Hand one card to each student. Each setup code is one-time use.
          </p>
        </div>

        <Button onClick={() => window.print()}>Print</Button>
      </div>

      {rows.length === 0 ? (
        <Card className="print:shadow-none print:border-0">
          <CardContent className="py-8 text-sm text-[hsl(var(--muted-fg))]">
            No setup codes found. Add students (bulk add) to generate new setup codes.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-2 print:gap-3">
          {rows.map((r) => (
            <Card
              key={`${r.studentId}-${r.username}`}
              className="shadow-[0_12px_40px_rgba(0,0,0,0.08)] rounded-[18px] border-0 print:shadow-none print:border print:rounded-[12px] [break-inside:avoid] print:[break-inside:avoid]"
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base">LearnMetrics</CardTitle>
                <CardDescription>Student login card</CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-sm pt-0">
                {r.name ? (
                  <div>
                    <div className="text-xs text-[hsl(var(--muted-fg))]">Student</div>
                    <div className="font-semibold text-[hsl(var(--fg))]">{r.name}</div>
                  </div>
                ) : null}

                <div>
                  <div className="text-xs text-[hsl(var(--muted-fg))]">Username</div>
                  <div className="font-mono text-base font-semibold text-[hsl(var(--fg))]">
                    {r.username}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-[hsl(var(--muted-fg))]">Setup code (one-time)</div>
                  <div className="font-mono text-lg font-bold tracking-widest text-[hsl(var(--fg))]">
                    {r.setupCode}
                  </div>
                </div>

                <div className="text-xs text-[hsl(var(--muted-fg))]">
                  Go to <span className="font-mono">{activateUrl}</span> to set your password.
                </div>

                {r.expiresAt ? (
                  <div className="text-[11px] text-[hsl(var(--muted-fg))]">
                    Expires: {new Date(r.expiresAt).toLocaleString()}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
