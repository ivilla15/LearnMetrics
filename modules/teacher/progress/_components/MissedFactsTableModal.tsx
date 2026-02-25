'use client';

import * as React from 'react';
import { Modal, Button, HelpText } from '@/components';
import type { MissedFactDTO } from '@/types';

export function MissedFactsTableModal({
  open,
  onClose,
  facts,
  onOpenFact,
}: {
  open: boolean;
  onClose: () => void;
  facts: MissedFactDTO[];
  onOpenFact: (fact: MissedFactDTO) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Most missed facts"
      description="Full list for the selected range. Click a fact for student details."
      size="lg"
      footer={
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="rounded-[18px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[hsl(var(--surface-2))] border-b border-[hsl(var(--border))] text-left">
                <th className="py-3 pl-4 pr-3">Fact</th>
                <th className="py-3 px-3 text-right">Incorrect</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 pl-3 pr-4 text-right">Error</th>
              </tr>
            </thead>
            <tbody>
              {facts.map((m) => (
                <tr
                  key={`${m.operation}:${m.operandA}x${m.operandB}`}
                  className="border-b border-[hsl(var(--border))] last:border-b-0 hover:bg-[hsl(var(--surface-2))] cursor-pointer"
                  onClick={() => onOpenFact(m)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onOpenFact(m);
                    }
                  }}
                >
                  <td className="py-3 pl-4 pr-3 font-medium text-[hsl(var(--fg))]">
                    {m.operandA} × {m.operandB} = {m.correctAnswer}
                  </td>
                  <td className="py-3 px-3 text-right">{m.incorrectCount}</td>
                  <td className="py-3 px-3 text-right">{m.totalCount}</td>
                  <td className="py-3 pl-3 pr-4 text-right">{m.errorRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <HelpText>
          Tip: The student detail view requires an API route that returns per-student miss counts
          for a question.
        </HelpText>
      </div>
    </Modal>
  );
}
