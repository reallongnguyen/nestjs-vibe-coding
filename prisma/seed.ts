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
  // Define templates
  const templates = [
    {
      name: 'Like Post Template',
      type: 'post_like',
      version: '1.0.0',
      contents: {
        VI: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d>{{#if (gt subject_count 1) }} và {{ math subject_count \'-\' 1 }} người khác{{/if}} đã thích bài viết {{ diObject.name }} của bạn{{#if prObject}} trong {{ prObject.name }}{{/if}}',
        EN: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d>{{#if (gt subject_count 1) }} and {{ math subject_count \'-\' 1 }} others{{/if}} liked your post {{ diObject.name }}{{#if prObject}} in {{ prObject.name }}{{/if}}',
      },
    },
    {
      name: 'Comment Post Template',
      type: 'commentPost',
      version: '1.0.0',
      contents: {
        VI: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d>{{#if (gt subject_count 1) }} và {{ math subject_count \'-\' 1 }} người khác{{/if}} đã bình luận về bài viết {{ diObject.name }} của bạn',
        EN: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d>{{#if (gt subject_count 1) }} and {{ math subject_count \'-\' 1 }} others{{/if}} commented on your post {{ diObject.name }}',
      },
    },
    {
      name: 'Mention Template',
      type: 'mention',
      version: '1.0.0',
      contents: {
        VI: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> đã nhắc đến bạn trong {{ inObject.type }} "{{ inObject.name }}"',
        EN: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> mentioned you in a {{ inObject.type }} "{{ inObject.name }}"',
      },
    },
    {
      name: 'Follow Template',
      type: 'follow',
      version: '1.0.0',
      contents: {
        VI: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d>{{#if (gt subject_count 1) }} và {{ math subject_count \'-\' 1 }} người khác{{/if}} đã bắt đầu theo dõi bạn',
        EN: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d>{{#if (gt subject_count 1) }} and {{ math subject_count \'-\' 1 }} others{{/if}} started following you',
      },
    },
  ];

  // Get existing templates
  const existingTemplates = await prisma.notificationTemplate.findMany({
    where: {
      type: {
        in: templates.map((t) => t.type),
      },
    },
    select: {
      type: true,
    },
  });

  const existingTypes = new Set(existingTemplates.map((t) => t.type));

  // Create templates that don't exist
  const templatesToCreate = templates.filter((t) => !existingTypes.has(t.type));

  if (templatesToCreate.length > 0) {
    const createPromises = templatesToCreate.map((template) =>
      prisma.notificationTemplate.create({
        data: {
          name: template.name,
          type: template.type,
          version: template.version,
          isActive: true,
          contents: {
            create: Object.entries(template.contents).map(
              ([language, content]) => ({
                language: language as 'EN' | 'VI',
                content,
              }),
            ),
          },
        },
      }),
    );

    await Promise.all(createPromises);

    templatesToCreate.forEach((template) => {
      console.log(`✅ Created notification template: ${template.type}`);
    });
  }

  templates
    .filter((t) => existingTypes.has(t.type))
    .forEach((template) => {
      console.log(`⏩ Template ${template.type} already exists, skipping`);
    });

  console.log('✅ Notification templates seeding completed');
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
