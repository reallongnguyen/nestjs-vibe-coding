/* eslint-disable no-console */
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

async function createRootUser(authId: string) {
  return prisma.user.create({
    data: {
      authId,
      firstName: 'Root',
      roles: [UserRole.ROOT, UserRole.ADMIN, UserRole.USER],
    },
  });
}

// Seed notification templates
async function seedNotificationTemplates() {
  // Check if template already exists
  const existingTemplate = await prisma.notificationTemplate.findUnique({
    where: { type: 'likePost' },
  });

  if (!existingTemplate) {
    // Create like post template
    await prisma.notificationTemplate.create({
      data: {
        name: 'Like Post Template',
        type: 'likePost',
        version: '1.0.0',
        isActive: true,
        contents: {
          create: [
            {
              language: 'VI',
              content:
                '<d class="font-semibold" type="user">{{ subjects.0.name }}</d>{{#if (gt subject_count 1) }} và {{ math subject_count \'-\' 1 }} người khác{{/if}} đã thích bài viết {{ diObject.name }} của bạn{{#if prObject}} trong {{ prObject.name }}{{/if}}',
            },
            {
              language: 'EN',
              content:
                '<d class="font-semibold" type="user">{{ subjects.0.name }}</d>{{#if (gt subject_count 1) }} and {{ math subject_count \'-\' 1 }} others{{/if}} liked your post {{ diObject.name }}{{#if prObject}} in {{ prObject.name }}{{/if}}',
            },
          ],
        },
      },
    });

    console.log('✅ Notification templates seeded');
  } else {
    console.log('⏩ Notification templates already exist, skipping seed');
  }
}

async function main() {
  const authId = process.env.ROOT_USER_AUTH_ID;

  if (authId) {
    await createRootUser(authId);
  } else {
    console.log('Environment variable ROOT_USER_AUTH_ID not found');
  }

  // Seed notification templates
  await seedNotificationTemplates();
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
