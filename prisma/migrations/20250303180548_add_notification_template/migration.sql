-- CreateEnum
CREATE TYPE "template_language" AS ENUM ('EN', 'VI');

-- AlterTable
ALTER TABLE "notifications" ALTER COLUMN "metadata" SET DEFAULT '{}';

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_template_contents" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "language" "template_language" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notification_template_contents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_type_key" ON "notification_templates"("type");

-- CreateIndex
CREATE UNIQUE INDEX "notification_template_contents_template_id_language_key" ON "notification_template_contents"("template_id", "language");

-- AddForeignKey
ALTER TABLE "notification_template_contents" ADD CONSTRAINT "notification_template_contents_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
