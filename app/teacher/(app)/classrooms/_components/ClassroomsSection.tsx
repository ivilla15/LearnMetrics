import { getTeacherClassroomsWithCounts } from '@/data';
import { renameClassroomAction, deleteClassroomAction } from '../_server/actions';
import { TeacherClassroomsClient } from '@/modules';

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
