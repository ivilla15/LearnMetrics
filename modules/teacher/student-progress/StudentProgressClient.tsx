'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';

import type { TeacherStudentProgressDTO, MissedFact } from '@/core/teacher/Progress';
import { SummaryCard, MissedFactsCard, PrintHeader, AttemptExplorer } from './_components';
import { useStudentProgress } from './hooks';

type Props = {
  classroomId: number;
  studentId: number;
  initial: TeacherStudentProgressDTO;
};

export function StudentProgressClient({ classroomId, studentId, initial }: Props) {
  const searchParams = useSearchParams();
  const printMode = searchParams.get('print') === '1';

  const { data, loading, daysText, setDaysText, applyDays } = useStudentProgress({
    classroomId,
    studentId,
    initial,
    printMode,
  });

  const s = data.student;

  const missedFacts: MissedFact[] = Array.isArray(data.insights?.topMissedFacts)
    ? data.insights.topMissedFacts
    : [];

  return (
    <div className="space-y-6">
      <PrintHeader data={data} />

      <SummaryCard
        classroomId={classroomId}
        studentId={studentId}
        data={data}
        loading={loading}
        daysText={daysText}
        onChangeDaysText={setDaysText}
        onApplyDays={applyDays}
        printMode={printMode}
      />

      <MissedFactsCard missedFacts={missedFacts} />

      <AttemptExplorer
        baseUrl={`/api/teacher/classrooms/${classroomId}/students/${studentId}`}
        studentId={studentId}
        studentName={s?.name}
        studentUsername={s?.username}
        hideControls={printMode}
      />
    </div>
  );
}
