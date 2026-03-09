'use client';

import type { StudentMeDTO } from '@/types';
import { PageHeader } from '@/components';

type Props = {
  loading: boolean;
  me: StudentMeDTO | null;
};

export function DashboardHeader({ loading, me }: Props) {
  return (
    <PageHeader
      title={loading ? 'Dashboard' : `Welcome, ${me?.name ?? ''}`}
      subtitle={loading ? 'Loading your assignments…' : 'Here’s what’s due and what’s next.'}
    />
  );
}
