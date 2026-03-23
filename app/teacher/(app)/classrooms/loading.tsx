import { PageHeader, Section } from '@/components';
import { ClassroomsGridSkeleton } from '@/modules';
export default function Loading() {
  return (
    <>
      <PageHeader
        title="Your Classrooms"
        subtitle="Open a class to manage students, schedules, and tests."
      />
      <Section>
        <ClassroomsGridSkeleton />
      </Section>
    </>
  );
}
