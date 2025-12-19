/*
  Warnings:

  - You are about to drop the `demo` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "demo";

-- CreateTable
CREATE TABLE "t_app_config" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "llm_config" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_app_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "t_app_config_user_id_key" ON "t_app_config"("user_id");
