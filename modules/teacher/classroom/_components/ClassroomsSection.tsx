import { getTeacherClassroomsWithCounts } from '@/data';
import { TeacherClassroomsClient } from '../TeacherClassroomsClient';
import { renameClassroomAction, deleteClassroomAction } from '../actions';

export async function ClassroomsSection({ teacherId }: { teacherId: number }) {
  const classrooms = await getTeacherClassroomsWithCounts(teacherId);

  return (
    <TeacherClassroomsClient
      classrooms={classrooms}
      renameAction={renameClassroomAction}
      deleteAction={deleteClassroomAction}
    />
  );
}
