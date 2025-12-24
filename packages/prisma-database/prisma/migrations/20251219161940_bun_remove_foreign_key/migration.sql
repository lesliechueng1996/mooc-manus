-- DropForeignKey
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";

-- DropForeignKey
ALTER TABLE "t_api_tool" DROP CONSTRAINT "t_api_tool_provider_id_fkey";

-- DropForeignKey
ALTER TABLE "t_api_tool_provider" DROP CONSTRAINT "t_api_tool_provider_user_id_fkey";

-- DropForeignKey
ALTER TABLE "t_dataset" DROP CONSTRAINT "t_dataset_user_id_fkey";

-- DropForeignKey
ALTER TABLE "t_document" DROP CONSTRAINT "t_document_dataset_id_fkey";

-- DropForeignKey
ALTER TABLE "t_document" DROP CONSTRAINT "t_document_process_rule_id_fkey";

-- DropForeignKey
ALTER TABLE "t_document" DROP CONSTRAINT "t_document_upload_file_id_fkey";

-- DropForeignKey
ALTER TABLE "t_keyword_table" DROP CONSTRAINT "t_keyword_table_dataset_id_fkey";

-- DropForeignKey
ALTER TABLE "t_process_rule" DROP CONSTRAINT "t_process_rule_dataset_id_fkey";

-- DropForeignKey
ALTER TABLE "t_process_rule" DROP CONSTRAINT "t_process_rule_user_id_fkey";

-- DropForeignKey
ALTER TABLE "t_segment" DROP CONSTRAINT "t_segment_document_id_fkey";

-- DropForeignKey
ALTER TABLE "t_upload_file" DROP CONSTRAINT "t_upload_file_user_id_fkey";
