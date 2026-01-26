'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Label,
  HelpText,
  StatBox,
} from '@/components';

import type { TeacherClassroomCardRow } from '@/data/classrooms.repo';

type Props = {
  classrooms: TeacherClassroomCardRow[];
  renameAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

type CreateButtonProps = {
  createAction: (formData: FormData) => Promise<void>;
};

function clampNameClient(raw: string) {
  const name = String(raw ?? '').trim();
  if (!name) return { ok: false as const, error: 'Classroom name is required.' };
  if (name.length > 80) return { ok: false as const, error: 'Classroom name must be ≤ 80 chars.' };
  return { ok: true as const, name };
}

function DotsButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]"
      aria-label="Open menu"
      title="More"
    >
      <span className="text-smleading-none">⋯</span>
    </button>
  );
}

function ModalShell({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[28px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))]">
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <div className="text-base font-semibold text-[hsl(var(--fg))]">{title}</div>
            {subtitle ? (
              <div className="text-xs text-[hsl(var(--muted-fg))]">{subtitle}</div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-(--radius) px-2 py-1 text-sm text-[hsl(var(--muted-fg))] hover:bg-[hsl(var(--surface-2))]"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

export function NewClassroomButton({ createAction }: CreateButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <Button
        onClick={() => {
          setName('');
          setError(null);
          setOpen(true);
        }}
      >
        + New classroom
      </Button>

      {open ? (
        <ModalShell
          title="Create a classroom"
          subtitle="Keep names short so they print nicely on login cards."
          onClose={() => setOpen(false)}
        >
          <form
            action={async (fd) => {
              const parsed = clampNameClient(name);
              if (!parsed.ok) {
                setError(parsed.error);
                return;
              }
              setError(null);

              const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles';
              fd.set('timeZone', String(tz));

              fd.set('name', parsed.name);
              await createAction(fd);
              setOpen(false);
            }}
            className="space-y-3"
          >
            <div className="grid gap-2">
              <Label htmlFor="new-name">Classroom name</Label>
              <Input
                id="new-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Example: Period 1"
                autoFocus
              />
              <HelpText>Max 80 characters.</HelpText>
              {error ? <div className="text-xs text-[hsl(var(--danger))]">{error}</div> : null}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create</Button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </>
  );
}

export function TeacherClassroomsClient({ classrooms, renameAction, deleteAction }: Props) {
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [activeClassroom, setActiveClassroom] = useState<TeacherClassroomCardRow | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);

  const sorted = useMemo(() => classrooms ?? [], [classrooms]);

  function openRename(c: TeacherClassroomCardRow) {
    setMenuOpenId(null);
    setActiveClassroom(c);
    setRenameValue(c.name ?? '');
    setRenameError(null);
    setRenameOpen(true);
  }

  function openDelete(c: TeacherClassroomCardRow) {
    setMenuOpenId(null);
    setActiveClassroom(c);
    setDeleteOpen(true);
  }

  return (
    <>
      {sorted.length === 0 ? (
        <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
          <CardContent className="py-10 text-[15px] text-[hsl(var(--muted-fg))]">
            No classrooms yet. Use <span className="font-semibold">New classroom</span> to create
            one.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((c) => (
            <div key={c.id} className="relative">
              <Link
                href={`/teacher/classrooms/${c.id}`}
                className="block"
                aria-label={`Open ${c.name?.trim() ? c.name : `Classroom ${c.id}`}`}
              >
                <Card className="group shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0 transition-transform hover:-translate-y-px hover:shadow-[0_26px_70px_rgba(0,0,0,0.12)]">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="truncate">
                          {c.name?.trim() ? c.name : `Classroom ${c.id}`}
                        </CardTitle>
                        <CardDescription>ID: {c.id}</CardDescription>
                      </div>

                      {/* IMPORTANT: stop click so it doesn't navigate */}
                      <div
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        <DotsButton
                          onClick={() => setMenuOpenId((prev) => (prev === c.id ? null : c.id))}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <StatBox align="center">
                        <div className="text-[11px] text-[hsl(var(--muted-fg))]">Students</div>
                        <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                          {c.studentCount}
                        </div>
                      </StatBox>

                      <StatBox align="center">
                        <div className="text-[11px] text-[hsl(var(--muted-fg))]">Schedules</div>
                        <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                          {c.scheduleCount}
                        </div>
                      </StatBox>

                      <StatBox align="center">
                        {' '}
                        <div className="text-[11px] text-[hsl(var(--muted-fg))]">Tests</div>
                        <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                          {c.assignmentCount}
                        </div>
                      </StatBox>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {menuOpenId === c.id ? (
                <div className="absolute right-4 top-14 z-20 w-44 overflow-hidden rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface))]">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openRename(c);
                    }}
                    className="block w-full px-5 py-3 text-left text-sm text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]"
                  >
                    Rename
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openDelete(c);
                    }}
                    className="block w-full px-5 py-3 text-left text-sm text-[hsl(var(--danger))] hover:bg-[hsl(var(--surface-2))]"
                  >
                    Delete
                  </button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {/* Rename modal */}
      {renameOpen && activeClassroom ? (
        <ModalShell
          title="Rename classroom"
          subtitle="Keep names short so they print nicely."
          onClose={() => setRenameOpen(false)}
        >
          <form
            action={async (fd) => {
              const parsed = clampNameClient(renameValue);
              if (!parsed.ok) {
                setRenameError(parsed.error);
                return;
              }
              setRenameError(null);

              fd.set('classroomId', String(activeClassroom.id));
              fd.set('name', parsed.name);

              await renameAction(fd);
              setRenameOpen(false);
            }}
            className="space-y-3"
          >
            <div className="grid gap-2">
              <Label htmlFor="rename-name">Classroom name</Label>
              <Input
                id="rename-name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                maxLength={80}
                placeholder="Example: Period 1"
              />
              <HelpText>Max 80 characters.</HelpText>
              {renameError ? (
                <div className="text-xs text-[hsl(var(--danger))]">{renameError}</div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setRenameOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {/* Delete modal */}
      {deleteOpen && activeClassroom ? (
        <ModalShell
          title="Delete classroom?"
          subtitle="This cannot be undone."
          onClose={() => setDeleteOpen(false)}
        >
          <div className="space-y-3">
            <div className="rounded-(--radius) border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] bg-[hsl(var(--surface-2))] p-3 text-sm text-[hsl(var(--fg))]">
              You’re about to delete{' '}
              <span className="font-semibold">
                {activeClassroom.name?.trim()
                  ? activeClassroom.name
                  : `Classroom ${activeClassroom.id}`}
              </span>
              .
            </div>

            <HelpText>
              Deletes this classroom and all related students, assignments, schedules, and attempts.
            </HelpText>

            <form
              action={async (fd) => {
                fd.set('classroomId', String(activeClassroom.id));
                await deleteAction(fd);
                setDeleteOpen(false);
              }}
              className="flex justify-end gap-2 pt-2"
            >
              <Button type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Delete
              </Button>
            </form>
          </div>
        </ModalShell>
      ) : null}

      {/* Click-out overlay to close menu */}
      {menuOpenId !== null ? (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setMenuOpenId(null)}
          style={{ background: 'transparent' }}
        />
      ) : null}
    </>
  );
}
