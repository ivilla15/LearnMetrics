import * as React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
            Choose which domains are enabled and the maximum level students progress to.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Level Range Section */}
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Level range</div>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-1">
                <Label>Max level</Label>
                <Input disabled value="12" className="w-full" />
                <HelpText>Sets the maximum level for each domain.</HelpText>
              </div>
            </div>
          </div>

          {/* Enabled Domains Section */}
          <div className="grid gap-2">
            <div className="text-sm font-semibold text-[hsl(var(--fg))]">Enabled domains</div>
            <div className="flex flex-wrap gap-4">
              {[
                'Whole Addition',
                'Whole Subtraction',
                'Whole Multiplication',
                'Whole Division',
              ].map((label) => (
                <div key={label} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]" />
                  <span className="text-sm text-[hsl(var(--muted-fg))]">{label}</span>
                </div>
              ))}
            </div>
            <HelpText>Students progress through enabled domains in the order listed above.</HelpText>
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
