import { prisma } from '@/data/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const teachers = await prisma.teacher.findMany({ select: { id: true, password: true } });
  const students = await prisma.student.findMany({ select: { id: true, password: true } });

  let tUpdated = 0;
  for (const t of teachers) {
    // Skip already-hashed passwords
    if (t.password.startsWith('$2a$') || t.password.startsWith('$2b$')) continue;

    const hashed = await bcrypt.hash(t.password, 10);
    await prisma.teacher.update({ where: { id: t.id }, data: { password: hashed } });
    tUpdated++;
  }

  let sUpdated = 0;
  for (const s of students) {
    if (s.password.startsWith('$2a$') || s.password.startsWith('$2b$')) continue;

    const hashed = await bcrypt.hash(s.password, 10);
    await prisma.student.update({ where: { id: s.id }, data: { password: hashed } });
    sUpdated++;
  }

  console.log(`Done. Teachers updated: ${tUpdated}, Students updated: ${sUpdated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
