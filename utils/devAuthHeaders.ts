export function devTeacherHeader() {
  return process.env.NODE_ENV === 'development' ? { 'x-teacher-id': '2' } : {};
}
