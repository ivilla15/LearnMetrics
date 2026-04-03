'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { AssignMakeupTestModal } from '@/modules';

import type { ClassroomProgressDTO, OperationCode } from '@/types';
import { OPERATION_CODES } from '@/types';
import { useClassroomProgress } from './hooks/useClassroomProgress';

import {
  ProgressSummaryCard,
  ScoreDistributionCard,
  LevelDistributionCard,
  MasteryTrendCard,
  MostMissedFactsCard,
  MissedFactsTableModal,
  MissedFactDetailModal,
  StudentsTableCard,
  StudentPickerModal,
} from './_components';

const OP_LABELS: Record<OperationCode, string> = {
  ADD: 'ADD',
  SUB: 'SUB',
  MUL: 'MUL',
  DIV: 'DIV',
};

type Props = {
  classroomId: number;
  initial: ClassroomProgressDTO;
};

export function ClassroomProgressClient({ classroomId, initial }: Props) {
  const router = useRouter();

  const p = useClassroomProgress({ classroomId, initial });

  return (
    <div className="space-y-6">
      <ProgressSummaryCard
        days={p.data?.range?.days ?? 30}
        masteryRateInRange={p.data?.summary?.masteryRateInRange ?? 0}
        avgPercentInRange={p.data?.summary?.avgPercentInRange ?? 0}
        activeStudents={p.participation.attemptedCount}
        totalStudents={p.participation.total}
        atRiskCount={p.data?.summary?.atRiskCount ?? 0}
        last3Tests={p.last3Tests}
        loading={p.loading}
        onOpenPicker={() => {
          p.setPickerSearch('');
          p.setPickerOpen(true);
        }}
        onOpenAssign={() => p.setAssignOpen(true)}
        onFilterAtRisk={() => p.setFilter('atRisk')}
        onScrollToStudents={p.scrollToStudentsTable}
        onPrint={() => window.print()}
      />

      {/* Operation Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => p.applyOperationTab(null)}
          className={[
            'cursor-pointer rounded-[999px] border px-4 py-1.5 text-sm font-medium transition-colors',
            p.operationTab === null
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
            onClick={() => p.applyOperationTab(op)}
            className={[
              'cursor-pointer rounded-[999px] border px-4 py-1.5 text-sm font-medium transition-colors',
              p.operationTab === op
                ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
            ].join(' ')}
          >
            {OP_LABELS[op]}
          </button>
        ))}
      </div>

      {/* Charts — 2-col grid for bar charts, full-width trend */}
      <div className="grid gap-6 md:grid-cols-2">
        <ScoreDistributionCard buckets={p.scoreBuckets} loading={p.loading} />
        <LevelDistributionCard buckets={p.levelBuckets} loading={p.loading} />
      </div>

      <MasteryTrendCard daily={p.dailyChart} loading={p.loading} />

      {p.hasMissedFacts ? (
        <>
          <MostMissedFactsCard
            top5={p.top5Missed}
            restCount={p.restMissed.length}
            maxIncorrect={p.maxIncorrect}
            onOpenAll={() => p.setMissedOpen(true)}
            onOpenFact={p.openFactDetail}
          />

          <MissedFactsTableModal
            open={p.missedOpen}
            onClose={() => p.setMissedOpen(false)}
            facts={p.missedFacts}
            onOpenFact={p.openFactDetail}
          />

          <MissedFactDetailModal
            open={p.missedDetailOpen}
            onClose={p.closeFactDetail}
            selectedFact={p.selectedFact}
            loading={p.factLoading}
            detail={p.factDetail}
            rows={p.factRows}
            maxIncorrect={p.factMaxIncorrect}
            onGoStudent={(studentId) =>
              router.push(`/teacher/classrooms/${classroomId}/students/${studentId}/progress`)
            }
          />
        </>
      ) : null}

      <StudentsTableCard
        tableRef={p.studentsTableRef}
        daysText={p.daysText}
        setDaysText={p.setDaysText}
        onApplyDays={p.applyDays}
        loading={p.loading}
        search={p.search}
        setSearch={p.setSearch}
        filter={p.filter}
        setFilter={p.setFilter}
        filtered={p.filtered}
        hasLastTest={p.hasLastTest}
        classroomId={classroomId}
        onGoStudent={(studentId) =>
          router.push(`/teacher/classrooms/${classroomId}/students/${studentId}/progress`)
        }
        onPrintStudent={(studentId) =>
          router.push(`/teacher/classrooms/${classroomId}/students/${studentId}/progress?print=1`)
        }
        onClearFilters={() => {
          p.setFilter('all');
          p.setSearch('');
        }}
      />

      <AssignMakeupTestModal
        open={p.assignOpen}
        onClose={() => p.setAssignOpen(false)}
        classroomId={classroomId}
        students={p.students}
        lastTestMeta={p.lastTestMeta}
        onCreated={async () => {
          const days = Number(p.data?.range?.days) || 30;
          await p.reload(days);
        }}
      />

      <StudentPickerModal
        open={p.pickerOpen}
        onClose={() => p.setPickerOpen(false)}
        search={p.pickerSearch}
        setSearch={p.setPickerSearch}
        students={p.pickerList}
        onPick={(studentId) => {
          p.setPickerOpen(false);
          router.push(`/teacher/classrooms/${classroomId}/students/${studentId}/progress`);
        }}
      />
    </div>
  );
}
