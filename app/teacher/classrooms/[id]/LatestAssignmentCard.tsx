'use client';

import { Card, CardHeader } from '@/components/Card';
import { LoadingSpinner } from '@/components/LoadingSpinner';

type LatestAssignment = {
  id: number;
  classroomId: number;
  kind: string;
  opensAt: string;
  closesAt: string;
  windowMinutes: number;
};

type Props = {
  latest: LatestAssignment | null | undefined;
  loading?: boolean;
  creating?: boolean;
  onCreateSingleTest?: () => void;
};

function formatLocal(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function LatestAssignmentCard({ latest, loading, creating, onCreateSingleTest }: Props) {
  return (
    <Card>
      <CardHeader title="Latest assignment" subtitle="Most recent test" />

      {loading ? (
        <div className="px-4 pb-4">
          <LoadingSpinner label="Loading latest assignment..." />
        </div>
      ) : !latest ? (
        <div className="px-4 pb-4 space-y-3 text-xs text-gray-100">
          <p className="text-gray-500">No assignments have been created yet for this classroom.</p>

          {onCreateSingleTest && (
            <button
              type="button"
              onClick={onCreateSingleTest}
              disabled={creating}
              className="inline-flex items-center rounded bg-emerald-700 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
            >
              Create single test
            </button>
          )}
        </div>
      ) : (
        <div className="px-4 pb-4 space-y-3 text-xs text-gray-500">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full bg-emerald-900/50 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                {latest.kind === 'FRIDAY_TEST' ? 'Friday test' : latest.kind}
              </span>
              <span className="text-black">{formatLocal(latest.opensAt)}</span>
            </div>

            {onCreateSingleTest && (
              <button
                type="button"
                onClick={onCreateSingleTest}
                disabled={creating}
                className="inline-flex items-center rounded bg-emerald-700 px-3 py-1 text-[11px] font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                Create single test
              </button>
            )}
          </div>

          {/* your existing details section stays the same */}
          <div className="space-y-1">
            <div>
              <span className="text-gray-900">Opens:&nbsp;</span>
              <span>{formatLocal(latest.opensAt)}</span>
            </div>
            <div>
              <span className="text-gray-900">Closes:&nbsp;</span>
              <span>{formatLocal(latest.closesAt)}</span>
            </div>
            <div>
              <span className="text-gray-900">Window:&nbsp;</span>
              <span>{latest.windowMinutes} minutes</span>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
