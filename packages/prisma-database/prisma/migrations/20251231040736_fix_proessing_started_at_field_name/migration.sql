/*
  Warnings:

  - You are about to drop the column `processing_start_at` on the `t_document` table. All the data in the column will be lost.
  - You are about to drop the column `processing_start_at` on the `t_segment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "t_document" DROP COLUMN "processing_start_at",
ADD COLUMN     "processing_started_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "t_segment" DROP COLUMN "processing_start_at",
ADD COLUMN     "processing_started_at" TIMESTAMP(3);
