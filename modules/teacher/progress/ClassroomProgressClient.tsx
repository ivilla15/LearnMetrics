'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { AssignMakeupTestModal } from '@/modules';

import type { ClassroomProgressDTO } from '@/types';
import { useClassroomProgress } from './hooks/useClassroomProgress';

import {
  ProgressSummaryCard,
  ScoreDistributionCard,
  LevelDistributionCard,
  MostMissedFactsCard,
  MissedFactsTableModal,
  MissedFactDetailModal,
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
        participationText={`${p.participation.attemptedCount}/${p.participation.total} (${p.participation.pct}%)`}
        missedLastTestCount={p.missedLastTestCount}
        masteryStreak2Count={p.masteryStreak2Count}
        atRiskCount={p.data?.summary?.atRiskCount ?? 0}
        nonMasteryStreak2Count={p.data?.summary?.nonMasteryStreak2Count ?? 0}
        lowestRecentPercent={p.data?.summary?.lowestRecentPercent ?? null}
        masteryRateInRange={p.data?.summary?.masteryRateInRange ?? 0}
        avgPercentInRange={p.data?.summary?.avgPercentInRange ?? 0}
        highestLevel={p.data?.summary?.highestLevel ?? '—'}
        attemptsInRange={p.data?.summary?.attemptsInRange ?? 0}
        studentsTotal={p.data?.summary?.studentsTotal ?? p.students.length}
        last3Tests={p.last3Tests}
        onOpenPicker={() => {
          p.setPickerSearch('');
          p.setPickerOpen(true);
        }}
        onOpenAssign={() => p.setAssignOpen(true)}
        onFilterAtRisk={() => p.setFilter('atRisk')}
        onFilterMissedLastTest={() => p.setFilter('missedLastTest')}
        onFilterMasteryStreak2={() => p.setFilter('masteryStreak2')}
        onFilterNonMasteryStreak2={() => p.setFilter('streak2')}
        onClearFilters={() => {
          p.setFilter('all');
          p.setSearch('');
        }}
        onScrollToStudents={p.scrollToStudentsTable}
        onGoStudent={(studentId) =>
          router.push(`/teacher/classrooms/${classroomId}/students/${studentId}/progress`)
        }
      />

      <ScoreDistributionCard buckets={p.scoreBuckets} maxBucket={p.maxBucket} />
      <LevelDistributionCard buckets={p.levelBuckets} maxBucket={p.maxLevelBucket} />

      {p.hasMissedFacts ? (
        <>
          <MostMissedFactsCard
            top3={p.top3Missed}
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
