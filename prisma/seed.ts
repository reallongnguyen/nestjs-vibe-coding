/* eslint-disable no-console */
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function createRootUser(authId: string) {
  return prisma.user.create({
    data: {
      authId,
      name: 'Root',
      roles: [UserRole.ROOT, UserRole.ADMIN, UserRole.USER],
    },
  });
}

async function main() {
  const authId = process.env.ROOT_USER_AUTH_ID;

  await createRootUser(authId);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
