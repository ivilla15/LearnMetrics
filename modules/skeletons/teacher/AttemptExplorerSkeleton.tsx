'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Skeleton } from '@/components';

export function AttemptExplorerSkeleton() {
  return (
    <div className="space-y-6">
      {/* 1. Level Progression Chart Card */}
      <Card>
        <CardHeader>
          <CardTitle>Level progression</CardTitle>
          <CardDescription>
            Each point shows the level after the test (mastery increases your level).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Matches the height of the LevelProgressChart */}
          <Skeleton as="div" className="h-48 w-full rounded-xl" />
        </CardContent>
      </Card>

      {/* 2. Attempts Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>Attempts</CardTitle>
              <CardDescription>Select one to view details.</CardDescription>
            </div>
            {/* Filter Dropdown Placeholder */}
            <div className="flex items-center gap-2">
              <div className="text-sm text-[hsl(var(--muted-fg))]">Filter</div>
              <Skeleton className="h-10 w-32 rounded-md" />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Matches the styling of AttemptResultsTable */}
          <div className="overflow-x-auto rounded-[28px] border-0 shadow-[0_4px_10px_rgba(0,0,0,0.08)] overflow-hidden bg-[hsl(var(--surface))]">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-2))]">
                  <th className="py-3 pl-5 pr-3">Completed</th>
                  <th className="py-3 px-3 text-center">Score</th>
                  <th className="py-3 px-3 text-center">%</th>
                  <th className="py-3 px-3 text-center">Missed</th>
                  <th className="py-3 px-3 text-center">Mastery</th>
                  <th className="py-3 px-3 text-center">Level at time</th>
                  <th className="py-3 pl-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* Generate 5 rows of standardized skeletons */}
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[hsl(var(--border))] last:border-b-0">
                    <td className="py-4 pl-5 pr-3">
                      <div className="space-y-2">
                        <Skeleton className="h-2 w-24" />
                        <Skeleton className="h-2 w-16 rounded-full" />
                      </div>
                    </td>
                    <td className="py-4 px-3 text-center">
                      <Skeleton className="h-2 w-8 mx-auto" />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <Skeleton className="h-2 w-8 mx-auto" />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <Skeleton className="h-2 w-4 mx-auto" />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <Skeleton className="h-2 w-10 rounded-full mx-auto" />
                    </td>
                    <td className="py-4 px-3 text-center">
                      <Skeleton className="h-2 w-12 mx-auto" />
                    </td>
                    <td className="py-4 pl-3 pr-5 text-right">
                      <Skeleton className="h-8 w-24 rounded-md" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
