'use client';

import * as React from 'react';
import type { AttemptDetailSelection, TeacherAssignmentAttemptRowDTO } from '@/types';
import { fetchAttemptDetail } from '../actions';

export function useAttemptDetail(params: { classroomId: number }) {
  const { classroomId } = params;

  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<AttemptDetailSelection | null>(null);

  const [detail, setDetail] = React.useState<unknown | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  const [showIncorrectOnly, setShowIncorrectOnly] = React.useState(false);

  async function openAttempt(row: TeacherAssignmentAttemptRowDTO) {
    if (!row.attemptId) return;

    setSelected({
      studentId: row.studentId,
      attemptId: row.attemptId,
      studentName: row.name,
      studentUsername: row.username,
    });

    setOpen(true);
    setDetail(null);
    setDetailError(null);
    setShowIncorrectOnly(false);

    setDetailLoading(true);
    try {
      const json = await fetchAttemptDetail({
        classroomId,
        studentId: row.studentId,
        attemptId: row.attemptId,
      });
      setDetail(json);
    } catch (e) {
      setDetail(null);
      setDetailError(e instanceof Error ? e.message : 'Failed to load attempt details');
    } finally {
      setDetailLoading(false);
    }
  }

  function close() {
    setOpen(false);
    setSelected(null);
    setDetail(null);
    setDetailError(null);
    setDetailLoading(false);
    setShowIncorrectOnly(false);
  }

  return {
    open,
    selected,
    detail,
    detailLoading,
    detailError,
    showIncorrectOnly,

    setShowIncorrectOnly,
    openAttempt,
    close,
  } as const;
}
