import type {
  BUILD_DOCUMENTS_TASK_NAME,
  DELETE_DATASET_TASK_NAME,
  DELETE_DOCUMENT_TASK_NAME,
  UPDATE_DOCUMENT_ENABLED_TASK_NAME,
} from './constant';

type BaseData = {
  requestId: string;
  userId: string;
};

export type BuildDocumentsTaskData = BaseData & {
  documentIds: string[];
  datasetId: string;
  taskName: typeof BUILD_DOCUMENTS_TASK_NAME;
};

export type UpdateDocumentEnabledTaskData = BaseData & {
  documentId: string;
  enabled: boolean;
  lockKey: string;
  lockValue: string;
  taskName: typeof UPDATE_DOCUMENT_ENABLED_TASK_NAME;
};

export type DeleteDocumentTaskData = BaseData & {
  datasetId: string;
  documentId: string;
  taskName: typeof DELETE_DOCUMENT_TASK_NAME;
};

export type DocumentTaskData =
  | BuildDocumentsTaskData
  | UpdateDocumentEnabledTaskData
  | DeleteDocumentTaskData;

export type DeleteDatasetTaskData = BaseData & {
  datasetId: string;
  taskName: typeof DELETE_DATASET_TASK_NAME;
};

export type DatasetTaskData = DeleteDatasetTaskData;
