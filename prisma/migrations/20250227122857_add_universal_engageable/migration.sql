-- CreateTable
CREATE TABLE "engageables" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "engageables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "likes" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "views" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "viewer_id" TEXT,
    "viewer_hash" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "engageables_type_content_id_idx" ON "engageables"("type", "content_id");

-- CreateIndex
CREATE UNIQUE INDEX "engageables_type_content_id_key" ON "engageables"("type", "content_id");

-- CreateIndex
CREATE INDEX "likes_type_content_id_idx" ON "likes"("type", "content_id");

-- CreateIndex
CREATE INDEX "likes_user_id_idx" ON "likes"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "likes_type_content_id_user_id_key" ON "likes"("type", "content_id", "user_id");

-- CreateIndex
CREATE INDEX "views_type_content_id_idx" ON "views"("type", "content_id");

-- CreateIndex
CREATE INDEX "views_viewer_hash_idx" ON "views"("viewer_hash");

-- CreateIndex
CREATE INDEX "views_timestamp_idx" ON "views"("timestamp");

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
