'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';

import type { TeacherStudentProgressDTO, MissedFactDTO, OperationCode, AttemptRowDTO } from '@/types';
import { OPERATION_CODES } from '@/types';
import {
  SummaryCard,
  MissedFactsCard,
  PrintHeader,
  AttemptExplorer,
  InterventionCallout,
  SkillJourneyTable,
} from './_components';
import { useStudentProgress } from './hooks';

const OP_LABELS: Record<OperationCode, string> = {
  ADD: 'ADD',
  SUB: 'SUB',
  MUL: 'MUL',
  DIV: 'DIV',
};

type Props = {
  classroomId: number;
  studentId: number;
  initial: TeacherStudentProgressDTO;
  /** Pass classroom-level avgPercentInRange for standing comparison */
  classroomAvgPercent?: number | null;
};

export function StudentProgressClient({
  classroomId,
  studentId,
  initial,
  classroomAvgPercent,
}: Props) {
  const searchParams = useSearchParams();
  const printMode = searchParams.get('print') === '1';

  const { data, loading, daysText, setDaysText, applyDays, operationTab, setOperationTab } =
    useStudentProgress({
      classroomId,
      studentId,
      initial,
      printMode,
    });

  // Attempts loaded by AttemptExplorer — used by SkillJourneyTable
  const [explorerAttempts, setExplorerAttempts] = React.useState<AttemptRowDTO[]>([]);

  const missedFacts: MissedFactDTO[] = Array.isArray(data.insights?.topMissedFacts)
    ? data.insights.topMissedFacts
    : [];

  const baseUrl = `/api/teacher/classrooms/${classroomId}/students/${studentId}`;

  return (
    <div className="space-y-6">
      <PrintHeader data={data} />

      {/* Header summary */}
      <SummaryCard
        classroomId={classroomId}
        studentId={studentId}
        data={data}
        loading={loading}
        daysText={daysText}
        onChangeDaysText={setDaysText}
        onApplyDays={applyDays}
        printMode={printMode}
        classroomAvgPercent={classroomAvgPercent}
      />

      {/* Intervention callout — between header and charts */}
      {!printMode ? <InterventionCallout student={data.student} /> : null}

      {/* Operation Tabs */}
      {!printMode ? (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setOperationTab(null)}
            className={[
              'cursor-pointer rounded-[999px] border px-4 py-1.5 text-sm font-medium transition-colors',
              operationTab === null
                ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
            ].join(' ')}
          >
            All
          </button>
          {OPERATION_CODES.map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setOperationTab(op)}
              className={[
                'cursor-pointer rounded-[999px] border px-4 py-1.5 text-sm font-medium transition-colors',
                operationTab === op
                  ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                  : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
              ].join(' ')}
            >
              {OP_LABELS[op]}
            </button>
          ))}
        </div>
      ) : null}

      {/* Missed facts */}
      <MissedFactsCard missedFacts={missedFacts} />

      {/* Skill Journey Table — powered by attempts loaded from explorer */}
      {explorerAttempts.length > 0 ? (
        <SkillJourneyTable
          attempts={explorerAttempts}
          onSelectOperation={(op) => setOperationTab(op)}
        />
      ) : null}

      {/* Attempt Explorer — level chart + week-grouped history */}
      <AttemptExplorer
        baseUrl={baseUrl}
        hideControls={printMode}
        operationFilter={operationTab}
        onAttemptsChange={setExplorerAttempts}
        currentLevel={data.student.level ?? undefined}
      />
    </div>
  );
}
