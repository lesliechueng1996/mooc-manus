-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- CreateTable
CREATE TABLE "t_upload_file" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "key" TEXT NOT NULL DEFAULT '',
    "size" INTEGER NOT NULL DEFAULT 0,
    "extension" TEXT NOT NULL DEFAULT '',
    "mime_type" TEXT NOT NULL DEFAULT '',
    "hash" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_upload_file_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_upload_file_user_id_idx" ON "t_upload_file"("user_id");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");
