import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { email: 'admin@salery.ma' },
    data: { password: hash }
  });
  console.log('Password reset successfully to admin123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
