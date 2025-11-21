-- CreateTable
CREATE TABLE "t_dataset" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_dataset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_process_rule" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT '',
    "rule" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_process_rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_document" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "upload_file_id" TEXT NOT NULL,
    "process_rule_id" TEXT NOT NULL,
    "batch" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 1,
    "character_count" INTEGER NOT NULL DEFAULT 0,
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "processing_start_at" TIMESTAMP(3),
    "parsing_completed_at" TIMESTAMP(3),
    "splitting_completed_at" TIMESTAMP(3),
    "indexing_completed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "stopped_at" TIMESTAMP(3),
    "error" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "disabled_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_segment" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT NOT NULL DEFAULT '',
    "character_count" INTEGER NOT NULL DEFAULT 0,
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "hash" TEXT NOT NULL DEFAULT '',
    "hit_count" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "disabled_at" TIMESTAMP(3),
    "processing_start_at" TIMESTAMP(3),
    "indexing_completed_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "stopped_at" TIMESTAMP(3),
    "error" TEXT,
    "status" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_segment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_keyword_table" (
    "id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "keywords" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_keyword_table_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_dataset_user_id_idx" ON "t_dataset"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_dataset_user_id_name_key" ON "t_dataset"("user_id", "name");

-- CreateIndex
CREATE INDEX "t_process_rule_user_id_idx" ON "t_process_rule"("user_id");

-- CreateIndex
CREATE INDEX "t_process_rule_dataset_id_idx" ON "t_process_rule"("dataset_id");

-- CreateIndex
CREATE INDEX "t_document_dataset_id_idx" ON "t_document"("dataset_id");

-- CreateIndex
CREATE INDEX "t_document_process_rule_id_idx" ON "t_document"("process_rule_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_document_upload_file_id_key" ON "t_document"("upload_file_id");

-- CreateIndex
CREATE INDEX "t_segment_dataset_id_idx" ON "t_segment"("dataset_id");

-- CreateIndex
CREATE INDEX "t_segment_document_id_idx" ON "t_segment"("document_id");

-- CreateIndex
CREATE INDEX "t_segment_node_id_idx" ON "t_segment"("node_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_keyword_table_dataset_id_key" ON "t_keyword_table"("dataset_id");
