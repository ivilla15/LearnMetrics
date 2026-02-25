'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components';

import { ClassroomCard } from './_components/ClassroomCard';
import { RenameClassroomDialog, DeleteClassroomDialog } from './_components/ClassroomDialogs';
import { TeacherClassroomCardRowDTO } from '@/types';

type Props = {
  classrooms: TeacherClassroomCardRowDTO[];
  renameAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function TeacherClassroomsClient({ classrooms, renameAction, deleteAction }: Props) {
  const sorted = useMemo(() => classrooms ?? [], [classrooms]);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [active, setActive] = useState<TeacherClassroomCardRowDTO | null>(null);

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
            <ClassroomCard
              key={c.id}
              classroom={c}
              onRename={() => {
                setActive(c);
                setRenameOpen(true);
              }}
              onDelete={() => {
                setActive(c);
                setDeleteOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <RenameClassroomDialog
        open={renameOpen}
        classroom={active}
        onClose={() => setRenameOpen(false)}
        renameAction={renameAction}
      />

      <DeleteClassroomDialog
        open={deleteOpen}
        classroom={active}
        onClose={() => setDeleteOpen(false)}
        deleteAction={deleteAction}
      />
    </>
  );
}
