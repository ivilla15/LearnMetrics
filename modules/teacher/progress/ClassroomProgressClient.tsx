'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { AssignMakeupTestModal } from '@/modules';

import type { ClassroomProgressDTO } from '@/types';
import { useClassroomProgress } from './hooks/useClassroomProgress';
import { Button, Input, Label } from '@/components';

import {
  ProgressSummaryCard,
  ScoreDistributionCard,
  LevelDistributionCard,
  MasteryTrendCard,
  MostMissedFactsCard,
  MissedFactsTableModal,
  MissedFactDetailModal,
  OperationDistributionCard,
  StudentsTableCard,
  StudentPickerModal,
} from './_components';

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

      {/* Charts — range control + 2-col bar charts */}
      <div className="flex items-end gap-3">
        <div className="grid gap-1">
          <Label htmlFor="chart-days" className="text-xs">Range (days)</Label>
          <div className="flex items-center gap-2">
            <Input
              id="chart-days"
              inputMode="numeric"
              value={p.daysText}
              onChange={(e) => p.setDaysText(e.target.value)}
              className="w-24"
            />
            <Button variant="secondary" onClick={p.applyDays} disabled={p.loading}>
              {p.loading ? 'Loading…' : 'Apply'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ScoreDistributionCard buckets={p.scoreBuckets} loading={p.loading} />
        <LevelDistributionCard students={p.students} loading={p.loading} />
      </div>

      {/* Trend + operation distribution side by side */}
      <div className="grid gap-6 md:grid-cols-2">
        <MasteryTrendCard daily={p.dailyChart} loading={p.loading} />
        <OperationDistributionCard students={p.students} loading={p.loading} />
      </div>

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
