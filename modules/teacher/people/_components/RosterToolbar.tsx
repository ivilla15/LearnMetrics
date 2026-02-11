'use client';

import * as React from 'react';
import { CardHeader, CardTitle, CardDescription, Button } from '@/components';

export function RosterToolbar(props: {
  selectedCount: number;
  bulkDeleteBusy: boolean;
  busy: boolean;
  hasPrintableCodes: boolean;

  onOpenAdd: () => void;
  onOpenBulkRemove: () => void;
  onPrintCards: () => void;
}) {
  const {
    selectedCount,
    bulkDeleteBusy,
    busy,
    hasPrintableCodes,
    onOpenAdd,
    onOpenBulkRemove,
    onPrintCards,
  } = props;

  return (
    <CardHeader className="space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle>People</CardTitle>
          <CardDescription>Manage students, reset access, or edit details.</CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedCount > 0 ? (
            <Button
              variant="destructive"
              onClick={onOpenBulkRemove}
              disabled={busy || bulkDeleteBusy}
            >
              {bulkDeleteBusy ? 'Removing…' : `Remove selected (${selectedCount})`}
            </Button>
          ) : null}

          {hasPrintableCodes ? (
            <Button variant="secondary" onClick={onPrintCards}>
              Print login cards
            </Button>
          ) : null}

          <Button onClick={onOpenAdd} disabled={busy}>
            + Add students
          </Button>
        </div>
      </div>
    </CardHeader>
  );
}
