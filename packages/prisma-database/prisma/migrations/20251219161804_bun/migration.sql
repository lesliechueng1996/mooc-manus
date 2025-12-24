-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_upload_file" ADD CONSTRAINT "t_upload_file_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_api_tool_provider" ADD CONSTRAINT "t_api_tool_provider_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_api_tool" ADD CONSTRAINT "t_api_tool_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "t_api_tool_provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_dataset" ADD CONSTRAINT "t_dataset_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_process_rule" ADD CONSTRAINT "t_process_rule_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_process_rule" ADD CONSTRAINT "t_process_rule_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "t_dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_document" ADD CONSTRAINT "t_document_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "t_dataset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_document" ADD CONSTRAINT "t_document_upload_file_id_fkey" FOREIGN KEY ("upload_file_id") REFERENCES "t_upload_file"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_document" ADD CONSTRAINT "t_document_process_rule_id_fkey" FOREIGN KEY ("process_rule_id") REFERENCES "t_process_rule"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_segment" ADD CONSTRAINT "t_segment_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "t_document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "t_keyword_table" ADD CONSTRAINT "t_keyword_table_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "t_dataset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
