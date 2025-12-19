-- AlterTable
ALTER TABLE "t_app_config" ADD COLUMN     "agent_config" JSONB NOT NULL DEFAULT '{}',
ALTER COLUMN "llm_config" SET DEFAULT '{}';
