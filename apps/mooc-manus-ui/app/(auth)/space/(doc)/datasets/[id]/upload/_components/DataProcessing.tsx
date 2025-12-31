'use client';

import { FileSignal } from 'lucide-react';
import { useEffect, useState } from 'react';

const formatFileSize = (fileSize: number) => {
  if (fileSize < 1024) {
    return `${fileSize}B`;
  }
  if (fileSize < 1024 * 1024) {
    return `${(fileSize / 1024).toFixed(2)}KB`;
  }
  return `${(fileSize / 1024 / 1024).toFixed(2)}MB`;
};

type Props = {
  batch: string | undefined;
};

const DataProcessing = ({ batch }: Props) => {
  const [documents, setDocuments] = useState<
    {
      id: string;
      name: string;
      fileSize: number;
      progress: number;
    }[]
  >([]);

  useEffect(() => {}, []);

  return (
    <div>
      <h1 className="text-sm font-medium mb-2">Server-side processing</h1>
      <div className="space-y-2">
        {documents.map((document) => (
          <div
            key={document.id}
            className="flex items-center bg-muted rounded-lg border py-2 px-4 gap-2"
          >
            <FileSignal className="shrink-0 size-6" />
            <div className="grow">
              <p>{document.name}</p>
              <p>{formatFileSize(document.fileSize)}</p>
            </div>
            <p className="shrink-0">
              {document.progress === 100
                ? 'Completed'
                : `${document.progress}%`}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataProcessing;
