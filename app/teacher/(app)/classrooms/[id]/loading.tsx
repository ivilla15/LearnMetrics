import { Section } from '@/components';
import {
  ClassroomHeaderSkeleton,
  ClassroomSubNavSkeleton,
  ClassroomStatsGridSkeleton,
} from './_components/ClassroomOverviewSkeletons';

export default function Loading() {
  return (
    <>
      <ClassroomHeaderSkeleton />
      <Section pad="md">
        <ClassroomSubNavSkeleton />
      </Section>
      <Section pad="md">
        <ClassroomStatsGridSkeleton />
      </Section>
    </>
  );
}
