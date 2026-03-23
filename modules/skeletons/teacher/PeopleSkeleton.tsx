import * as React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
  Button,
} from '@/components';

export function PeopleSkeleton() {
  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>People</CardTitle>
            <CardDescription>Manage students, reset access, or edit details.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button loading>+ Add students</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="overflow-x-auto rounded-[28px] overflow-hidden bg-[hsl(var(--surface))] shadow-[0_4px_10px_rgba(0,0,0,0.08)]">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--surface-2))]">
              <tr className="text-left border-b border-[hsl(var(--border))]">
                <th className="py-3 pl-5 pr-3 w-12">
                  <div className="h-4 w-4 rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface))]" />
                </th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Username</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-center">Operation</th>
                <th className="py-3 px-3 text-center">Level</th>
                <th className="py-3 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-[hsl(var(--border))] last:border-b-0">
                  {/* Checkbox Column */}
                  <td className="py-3 pl-5 pr-3">
                    <div className="h-4 w-4 rounded border border-[hsl(var(--border))]" />
                  </td>
                  {/* Name Column */}
                  <td className="py-3 px-3">
                    <Skeleton className="h-5 w-30" />
                  </td>
                  {/* Username Column */}
                  <td className="py-3 px-3">
                    <Skeleton className="h-3 w-21" />
                  </td>
                  {/* Status Column */}
                  <td className="py-3 px-3">
                    <Skeleton className="h-6 w-17 rounded-full" />
                  </td>
                  {/* Operation Column */}
                  <td className="py-3 px-3 text-center">
                    <Skeleton className="h-4 w-24 mx-auto" />
                  </td>
                  {/* Level Column */}
                  <td className="py-3 px-3 text-center">
                    <Skeleton className="h-4 w-8 mx-auto" />
                  </td>
                  {/* Actions Column */}
                  <td className="py-3 pl-3 pr-5">
                    <div className="flex justify-end gap-2">
                      <Button loading variant={'secondary'}>
                        Progress
                      </Button>
                      <Button loading variant={'secondary'}>
                        Reset Access
                      </Button>
                      <Button loading variant={'secondary'}>
                        Edit
                      </Button>
                      <Button loading variant={'destructive'}>
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
