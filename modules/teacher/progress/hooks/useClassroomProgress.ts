'use client';

import * as React from 'react';
import { useToast } from '@/components';
import type { ClassroomProgressDTO, FactDetailDTO, FilterKey, MissedFactDTO } from '@/types';

export function useClassroomProgress(params: {
  classroomId: number;
  initial: ClassroomProgressDTO;
}) {
  const { classroomId, initial } = params;
  const toast = useToast();

  const [data, setData] = React.useState(initial);
  const [loading, setLoading] = React.useState(false);

  const [filter, setFilter] = React.useState<FilterKey>('all');
  const [search, setSearch] = React.useState('');

  const [pickerSearch, setPickerSearch] = React.useState('');

  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [missedOpen, setMissedOpen] = React.useState(false);
  const [missedDetailOpen, setMissedDetailOpen] = React.useState(false);
  const [assignOpen, setAssignOpen] = React.useState(false);

  const [factLoading, setFactLoading] = React.useState(false);
  const [selectedFact, setSelectedFact] = React.useState<MissedFactDTO | null>(null);
  const [factDetail, setFactDetail] = React.useState<FactDetailDTO | null>(null);

  const studentsTableRef = React.useRef<HTMLDivElement | null>(null);

  const [daysText, setDaysText] = React.useState(String(initial?.range?.days ?? 30));
  React.useEffect(() => {
    if (data?.range?.days) setDaysText(String(data.range.days));
  }, [data?.range?.days]);

  async function reload(nextDays: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/teacher/classrooms/${classroomId}/progress?days=${nextDays}`, {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = typeof json?.error === 'string' ? json.error : 'Failed to load progress';
        toast(msg, 'error');
        return;
      }

      setData(json as ClassroomProgressDTO);
    } finally {
      setLoading(false);
    }
  }

  function applyDays() {
    const parsed = Number(daysText);
    const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 30;

    setFilter('all');
    setSearch('');
    void reload(safe);
  }

  function scrollToStudentsTable() {
    requestAnimationFrame(() => {
      studentsTableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  async function openFactDetail(fact: MissedFactDTO) {
    setSelectedFact(fact);
    setFactDetail(null);
    setMissedDetailOpen(true);

    setFactLoading(true);
    try {
      const days = Number(data?.range?.days) || 30;

      const url = new URL(
        `/api/teacher/classrooms/${classroomId}/progress`,
        window.location.origin,
      );
      url.searchParams.set('days', String(days));
      url.searchParams.set('operation', fact.operation);
      url.searchParams.set('operandA', String(fact.operandA));
      url.searchParams.set('operandB', String(fact.operandB));

      const res = await fetch(url.toString(), { cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = typeof json?.error === 'string' ? json.error : 'Failed to load fact detail';
        toast(msg, 'error');
        return;
      }

      setFactDetail(json as FactDetailDTO);
    } finally {
      setFactLoading(false);
    }
  }

  function closeFactDetail() {
    setMissedDetailOpen(false);
    setSelectedFact(null);
    setFactDetail(null);
  }

  // --- Derived data ---
  const students = React.useMemo(() => data.students ?? [], [data.students]);
  const last3Tests = React.useMemo(() => data.recent?.last3Tests ?? [], [data.recent?.last3Tests]);
  const missedFacts = React.useMemo(
    () => data.insights?.topMissedFacts ?? [],
    [data.insights?.topMissedFacts],
  );

  const hasMissedFacts = missedFacts.some((m) => (m.incorrectCount ?? 0) > 0);
  const top3Missed = missedFacts.slice(0, 3);
  const restMissed = missedFacts.slice(3);
  const maxIncorrect = missedFacts.reduce((m, r) => Math.max(m, r.incorrectCount ?? 0), 0);

  const scoreBuckets = data.charts?.scoreBuckets ?? [];
  const maxBucket = scoreBuckets.reduce((m, r) => Math.max(m, r.count), 0);

  const levelBuckets = data.charts?.levelBuckets ?? [];
  const maxLevelBucket = levelBuckets.reduce((m, r) => Math.max(m, r.count), 0);

  const participation = React.useMemo(() => {
    const attemptedIds = new Set<number>();
    for (const s of students) {
      if ((s?.attemptsInRange ?? 0) > 0) attemptedIds.add(s.id);
    }
    const attemptedCount = attemptedIds.size;
    const total = students.length;
    const pct = total > 0 ? Math.round((attemptedCount / total) * 100) : 0;
    return { attemptedCount, total, pct };
  }, [students]);

  const lastTestMeta = React.useMemo(
    () =>
      last3Tests[0]
        ? { numQuestions: last3Tests[0].numQuestions, windowMinutes: 4, questionSetId: null }
        : null,
    [last3Tests],
  );

  const hasLastTest = last3Tests.length > 0;

  const missedLastTestCount =
    typeof data?.summary?.missedLastTestCount === 'number'
      ? data.summary.missedLastTestCount
      : null;

  const masteryStreak2Count = React.useMemo(
    () => students.reduce((acc, s) => acc + ((s.masteryStreak ?? 0) >= 2 ? 1 : 0), 0),
    [students],
  );

  const pickerList = React.useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s) => `${s.name} ${s.username}`.toLowerCase().includes(q));
  }, [students, pickerSearch]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();

    return students.filter((s) => {
      if (q) {
        const hay = `${s.name} ${s.username}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      switch (filter) {
        case 'atRisk':
          return !!s.flags?.atRisk;
        case 'stale14':
          return !!s.flags?.stale14Days;
        case 'streak2':
          return !!s.flags?.nonMasteryStreak2;
        case 'masteryStreak2':
          return (s.masteryStreak ?? 0) >= 2;
        case 'needsSetup':
          return !!s.flags?.needsSetup;
        case 'improving':
          return s.trendLast3 === 'improving';
        case 'regressing':
          return s.trendLast3 === 'regressing';
        case 'missedLastTest':
          return !!s.flags?.missedLastTest;
        default:
          return true;
      }
    });
  }, [students, filter, search]);

  const factRows = factDetail?.students ?? [];
  const factMaxIncorrect = factRows.reduce((m, r) => Math.max(m, r.incorrectCount ?? 0), 0);

  return {
    data,
    loading,
    filter,
    search,
    pickerSearch,
    pickerOpen,
    missedOpen,
    missedDetailOpen,
    assignOpen,
    factLoading,
    selectedFact,
    factDetail,
    daysText,
    studentsTableRef,

    setFilter,
    setSearch,
    setPickerSearch,
    setPickerOpen,
    setMissedOpen,
    setMissedDetailOpen,
    setAssignOpen,
    setDaysText,

    reload,
    applyDays,
    scrollToStudentsTable,
    openFactDetail,
    closeFactDetail,

    students,
    last3Tests,
    missedFacts,
    top3Missed,
    restMissed,
    hasMissedFacts,
    maxIncorrect,
    scoreBuckets,
    maxBucket,
    levelBuckets,
    maxLevelBucket,
    participation,
    lastTestMeta,
    hasLastTest,
    missedLastTestCount,
    masteryStreak2Count,
    pickerList,
    filtered,
    factRows,
    factMaxIncorrect,
  };
}
