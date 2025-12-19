-- CreateTable
CREATE TABLE "t_api_tool_provider" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "icon" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "openapi_schema" TEXT NOT NULL DEFAULT '',
    "headers" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_api_tool_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "t_api_tool" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL DEFAULT '',
    "method" TEXT NOT NULL DEFAULT '',
    "parameters" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "t_api_tool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "t_api_tool_provider_user_id_idx" ON "t_api_tool_provider"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_api_tool_provider_user_id_name_key" ON "t_api_tool_provider"("user_id", "name");

-- CreateIndex
CREATE INDEX "t_api_tool_user_id_idx" ON "t_api_tool"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "t_api_tool_provider_id_name_key" ON "t_api_tool"("provider_id", "name");
