export type BulkCreateStudentArgs = {
  teacherId: number;
  classroomId: number;
  students: {
    firstName: string;
    lastName: string;
    username: string;
    level: number;
  }[];
};

export type MeDTO = {
  id: number;
  name: string;
  username: string;
  level: number;
  email?: string;
};
