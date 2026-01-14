export type ClassroomSubNavItem = {
  label: string;
  href: (classroomId: number) => string;
  exact?: boolean;
};

export const ClassroomSubNavItems: ClassroomSubNavItem[] = [
  {
    label: 'Overview',
    href: (id) => `/teacher/classrooms/${id}`,
    exact: true,
  },
  {
    label: 'Assignments',
    href: (id) => `/teacher/classrooms/${id}/assignments`,
  },
  {
    label: 'People',
    href: (id) => `/teacher/classrooms/${id}/people`,
  },
  {
    label: 'Progress',
    href: (id) => `/teacher/classrooms/${id}/progress`,
  },
  {
    label: 'Schedules',
    href: (id) => `/teacher/classrooms/${id}/schedules`,
  },
];
