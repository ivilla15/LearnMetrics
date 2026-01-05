// app/teacher/classrooms/[id]/components/RosterTable.tsx
'use client';

import { useMemo, useState } from 'react';
import type { StudentRow } from './hooks';
import { useToast } from '@/components/ToastProvider';
import {
  generateUsernames,
  generatePasswords,
  type NewStudentName,
  type NewStudentInput,
} from '@/utils/students';
import Link from 'next/link';

type RosterTableProps = {
  classroomId: number;
  students: StudentRow[];
  busy?: boolean;
  // Bulk add (teacher gives only names; we send full NewStudentInput list)
  onBulkAdd: (students: NewStudentInput[]) => Promise<void>;
  // Per-student update/delete
  onUpdateStudent: (
    id: number,
    update: { name: string; username: string; level: number },
  ) => Promise<void>;
  onDeleteStudent: (id: number) => Promise<void>;
  // Delete all students (with optional cascading)
  onDeleteAll: (options: { deleteAssignments: boolean; deleteSchedules: boolean }) => Promise<void>;
};

type EditingState = {
  id: number;
  name: string;
  username: string;
  level: number;
};

export function RosterTable({
  classroomId,
  students,
  busy = false,
  onBulkAdd,
  onUpdateStudent,
  onDeleteStudent,
  onDeleteAll,
}: RosterTableProps) {
  const toast = useToast();

  const [isAdding, setIsAdding] = useState(false);
  const [bulkNamesText, setBulkNamesText] = useState('');
  const [bulkError, setBulkError] = useState<string | null>(null);

  const [editing, setEditing] = useState<EditingState | null>(null);
  const [deleteAllBusy, setDeleteAllBusy] = useState(false);
  const [deleteAllAssignments, setDeleteAllAssignments] = useState(false);
  const [deleteAllSchedules, setDeleteAllSchedules] = useState(false);

  const existingUsernames = useMemo(() => students.map((s) => s.username), [students]);

  // ----- Bulk add -----

  const handleOpenAdd = () => {
    setBulkNamesText('');
    setBulkError(null);
    setIsAdding(true);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setBulkError(null);
  };

  const parseNames = (raw: string): NewStudentName[] => {
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const parts = line.split(/\s+/);
        const firstName = parts[0] ?? '';
        const lastName = parts.slice(1).join(' ') || '';
        return { firstName, lastName };
      })
      .filter((n) => n.firstName && n.lastName);
  };

  const handleSaveAdd = async () => {
    const names = parseNames(bulkNamesText);

    if (!names.length) {
      setBulkError('Please enter at least one line with "First Last".');
      return;
    }

    try {
      setBulkError(null);

      const usernames = generateUsernames(names, existingUsernames);
      const passwords = generatePasswords(names.length);

      const payload: NewStudentInput[] = names.map((n, idx) => ({
        firstName: n.firstName,
        lastName: n.lastName,
        username: usernames[idx],
        password: passwords[idx],
        level: 1,
      }));

      await onBulkAdd(payload);
      setIsAdding(false);
      setBulkNamesText('');
      toast(`Added ${payload.length} student${payload.length === 1 ? '' : 's'}`, 'success');
    } catch (err) {
      console.error(err);
      setBulkError('Could not add students. Please try again.');
      toast('Failed to add students', 'error');
    }
  };

  // ----- Edit row -----

  const startEditing = (student: StudentRow) => {
    setEditing({
      id: student.id,
      name: student.name,
      username: student.username,
      level: student.level,
    });
  };

  const cancelEditing = () => {
    setEditing(null);
  };

  const handleEditingChange = (field: keyof Omit<EditingState, 'id'>, value: string) => {
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            [field]: field === 'level' ? Number(value) || 1 : value,
          }
        : prev,
    );
  };

  const saveEditing = async () => {
    if (!editing) return;
    try {
      await onUpdateStudent(editing.id, {
        name: editing.name,
        username: editing.username,
        level: editing.level || 1,
      });
      toast('Student updated', 'success');
      setEditing(null);
    } catch (err) {
      console.error(err);
      toast('Failed to update student', 'error');
    }
  };

  // ----- Delete single -----

  const handleDeleteStudent = async (id: number) => {
    const confirmed = window.confirm('Delete this student from the roster?');
    if (!confirmed) return;

    try {
      await onDeleteStudent(id);
      toast('Student deleted', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to delete student', 'error');
    }
  };

  // ----- Delete all -----

  const handleDeleteAll = async () => {
    const confirmed = window.confirm(
      'Delete ALL students in this classroom? You can optionally delete their assignments and schedules, too.',
    );
    if (!confirmed) return;

    try {
      setDeleteAllBusy(true);
      await onDeleteAll({
        deleteAssignments: deleteAllAssignments,
        deleteSchedules: deleteAllSchedules,
      });
      toast('All students deleted', 'success');
    } catch (err) {
      console.error(err);
      toast('Failed to delete all students', 'error');
    } finally {
      setDeleteAllBusy(false);
    }
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-800">Roster</h2>
        <button
          type="button"
          onClick={handleOpenAdd}
          disabled={busy}
          className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          + Add students
        </button>
      </div>

      {/* Bulk add modal-ish card */}
      {isAdding && (
        <div className="rounded-xl border border-blue-300 bg-blue-50/60 p-4 shadow-sm">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-gray-800">Add multiple students</span>
          </div>
          <p className="mb-2 text-xs text-gray-700">
            Paste one student per line in the format:
            <span className="ml-1 rounded bg-white px-1 py-0.5 font-mono text-[11px]">
              First Last
            </span>
          </p>
          <textarea
            rows={6}
            value={bulkNamesText}
            onChange={(e) => setBulkNamesText(e.target.value)}
            className="mb-2 w-full rounded-lg border border-gray-200 px-2 py-1 text-sm font-mono"
            placeholder={`Ada Lovelace\nAlan Turing\nGrace Hopper`}
          />
          {bulkError && <p className="mb-2 text-xs text-red-600">{bulkError}</p>}

          <p className="mb-3 text-[11px] text-gray-600">
            Usernames will be generated as{' '}
            <span className="font-mono">firstInitial + lastName</span> (e.g. &nbsp;
            <span className="font-mono">alovelace</span>), with numbers added if needed. Passwords
            will be short, memorable words plus a number (e.g.{' '}
            <span className="font-mono">apple10</span>).
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelAdd}
              disabled={busy}
              className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAdd}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? 'Saving…' : 'Add students'}
            </button>
          </div>
        </div>
      )}

      {/* Roster table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Username</th>
              <th className="px-3 py-2">Password</th>
              <th className="px-3 py-2 text-center">Level</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-4 text-center text-xs text-gray-500">
                  No students yet. Use &quot;Add students&quot; to create your roster.
                </td>
              </tr>
            ) : (
              students.map((student) => {
                const isEditingRow = editing?.id === student.id;

                return (
                  <tr key={student.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                    <td className="px-3 py-2">
                      {isEditingRow ? (
                        <input
                          type="text"
                          value={editing.name}
                          onChange={(e) => handleEditingChange('name', e.target.value)}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs"
                        />
                      ) : (
                        <span className="text-sm text-gray-800">{student.name}</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {isEditingRow ? (
                        <input
                          type="text"
                          value={editing.username}
                          onChange={(e) => handleEditingChange('username', e.target.value)}
                          className="w-full rounded border border-gray-200 px-2 py-1 text-xs font-mono"
                        />
                      ) : (
                        <span className="font-mono text-xs text-gray-800">{student.username}</span>
                      )}
                    </td>
                    {/* Password (display only, no edit for now) */}
                    <td className="px-3 py-2">
                      <span className="font-mono text-xs text-gray-800">{student.password}</span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {isEditingRow ? (
                        <input
                          type="number"
                          min={1}
                          value={editing.level}
                          onChange={(e) => handleEditingChange('level', e.target.value)}
                          className="w-16 rounded border border-gray-200 px-2 py-1 text-xs text-center"
                        />
                      ) : (
                        <span className="text-sm text-gray-800">{student.level}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isEditingRow ? (
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEditing}
                            disabled={busy}
                            className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={saveEditing}
                            disabled={busy}
                            className="rounded bg-blue-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/teacher/classrooms/${classroomId}/students/${student.id}/progress`}
                            className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-800 hover:bg-gray-100"
                          >
                            Progress
                          </Link>

                          <button
                            type="button"
                            onClick={() => startEditing(student)}
                            disabled={busy}
                            className="rounded border border-gray-200 px-2 py-1 text-[11px] text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student.id)}
                            disabled={busy}
                            className="rounded border border-red-200 px-2 py-1 text-[11px] text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete all section */}
      <div className="flex flex-col items-start gap-3 rounded-lg border border-red-200 bg-red-50/60 px-3 py-3 text-xs text-red-800 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-semibold">Danger zone: Delete all students</p>
          <p className="mt-1 text-[11px]">
            This will remove every student from this classroom. You can also choose to delete all of
            their assignments and schedules.
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 md:flex-row md:items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={deleteAllAssignments}
              onChange={(e) => setDeleteAllAssignments(e.target.checked)}
            />
            <span>Also delete assignments</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={deleteAllSchedules}
              onChange={(e) => setDeleteAllSchedules(e.target.checked)}
            />
            <span>Also delete schedules</span>
          </label>
          <button
            type="button"
            onClick={handleDeleteAll}
            disabled={deleteAllBusy || busy}
            className="rounded border border-red-400 bg-red-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleteAllBusy ? 'Deleting…' : 'Delete all students'}
          </button>
        </div>
      </div>
    </section>
  );
}
