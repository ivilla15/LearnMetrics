import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  Button,
  Label,
  Input,
  HelpText,
} from '@/components';

export function ProgressionSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
        <CardHeader>
          <CardTitle>Class progression</CardTitle>
          <CardDescription>
            Choose which operations are enabled, the order students progress through them, and when
            decimals/fractions unlock.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* 1. Level Range Section */}
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Level range</div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-1">
                <Label>Max level</Label>
                <Input disabled value="12" className="w-full" />
                <HelpText>Sets the maximum level for each operation.</HelpText>
              </div>
            </div>
          </div>

          {/* 2. Enabled Operations Section */}
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Enabled operations</div>
            <div className="flex flex-wrap gap-4">
              {['ADD', 'SUB', 'MUL', 'DIV'].map((op) => (
                <div key={op} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]" />
                  <span className="font-mono text-sm text-[hsl(var(--muted-fg))]">{op}</span>
                </div>
              ))}
            </div>
            <HelpText>Students progress through enabled operations in the order below.</HelpText>
          </div>

          {/* 3. Operation Order Section */}
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Operation order</div>
            <div className="grid gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-(--radius) bg-[hsl(var(--surface-2))] px-3 py-2"
                >
                  <Skeleton className="h-4 w-12" />
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" loading>
                      Up
                    </Button>
                    <Button variant="secondary" size="sm" loading>
                      Down
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Modifiers Section */}
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Modifiers</div>
            <div className="grid gap-4">
              {[1, 2].map((i) => (
                <div key={i} className="rounded-[20px] bg-[hsl(var(--surface-2))] p-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-48" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[hsl(var(--muted-fg))]">
                        Operations affected
                      </div>
                      <div className="flex gap-3">
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </div>
                    <div className="grid gap-1">
                      <div className="text-xs font-semibold text-[hsl(var(--muted-fg))]">
                        Unlock at level
                      </div>
                      <Skeleton className="h-10 w-full rounded-[var(--radius)]" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="secondary" size="sm" loading>
                      Clear
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="flex justify-end pt-4 border-t border-[hsl(var(--border))]">
            <Button size="lg" className="w-full md:w-32" loading>
              Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
