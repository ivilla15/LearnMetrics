import { Section } from '@/components';
import { ProgressSectionSkeleton } from './_components';
import { ClassroomHeaderSkeleton, ClassroomSubNavSkeleton } from '../_components';

export default function Loading() {
  return (
    <>
      <ClassroomHeaderSkeleton />
      <Section pad="md">
        <ClassroomSubNavSkeleton />
      </Section>
      <Section pad="md">
        <ProgressSectionSkeleton />
      </Section>
    </>
  );
}
