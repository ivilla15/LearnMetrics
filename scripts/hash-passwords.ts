import { prisma } from '@/data/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const teachers = await prisma.teacher.findMany({
    select: { id: true, passwordHash: true },
  });

  const students = await prisma.student.findMany({
    select: { id: true, passwordHash: true },
  });

  let tUpdated = 0;
  for (const t of teachers) {
    if (!t.passwordHash) continue;

    // Skip already-hashed passwords
    if (t.passwordHash.startsWith('$2a$') || t.passwordHash.startsWith('$2b$')) continue;

    const hashed = await bcrypt.hash(t.passwordHash, 10);
    await prisma.teacher.update({
      where: { id: t.id },
      data: { passwordHash: hashed },
    });
    tUpdated++;
  }

  let sUpdated = 0;
  for (const s of students) {
    if (!s.passwordHash) continue;

    if (s.passwordHash.startsWith('$2a$') || s.passwordHash.startsWith('$2b$')) continue;

    const hashed = await bcrypt.hash(s.passwordHash, 10);
    await prisma.student.update({
      where: { id: s.id },
      data: { passwordHash: hashed },
    });
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