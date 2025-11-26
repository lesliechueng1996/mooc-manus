'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { defineStepper } from '@/components/ui/stepper';
import ChunkingStrategy, {
  type ChunkingStrategyType,
} from './_components/ChunkingStrategy';
import DataProcessing from './_components/DataProcessing';
import UploadDocument from './_components/UploadDocument';

const { useStepper, steps, utils } = defineStepper(
  {
    id: 'upload',
    title: 'Upload',
  },
  {
    id: 'chunking-strategy',
    title: 'Chunking Strategy',
  },
  {
    id: 'data-processing',
    title: 'Data Processing',
  },
);

type UploadFileData = {
  fileids: string[];
  chunkingStrategy: ChunkingStrategyType;
};

const UploadFilePage = () => {
  const { id } = useParams<{ id: string }>();
  const stepper = useStepper();
  const [canChangePage, setCanChangePage] = useState<boolean>(true);
  const [uploadFileData, setUploadFileData] = useState<UploadFileData>({
    fileids: [],
    chunkingStrategy: {
      processType: 'automatic',
    },
  });

  const currentIndex = utils.getIndex(stepper.current.id);

  const handleActionStart = () => {
    setCanChangePage(false);
  };

  const handleActionEnd = () => {
    setCanChangePage(true);
  };

  return (
    <div className="flex flex-col h-screen">
      <header className="h-10 flex items-center justify-start gap-3 my-6 shrink-0">
        <Link href={`/space/datasets/${id}/documents`}>
          <Button variant="ghost" size="icon">
            <ChevronLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-lg font-bold">Upload File</h1>
      </header>

      <nav
        aria-label="Upload Steps"
        className="group w-full md:max-w-xl lg:max-w-2xl xl:max-w-3xl mx-auto mb-12 shrink-0 px-4"
      >
        <ol
          className="flex items-center justify-between gap-2"
          aria-label="Upload Steps"
        >
          {stepper.all.map((step, index, array) => (
            <React.Fragment key={step.id}>
              <li className="flex items-center gap-4 shrink-0">
                <Button
                  type="button"
                  role="tab"
                  variant={index <= currentIndex ? 'default' : 'secondary'}
                  aria-current={
                    stepper.current.id === step.id ? 'step' : undefined
                  }
                  aria-posinset={index + 1}
                  aria-setsize={steps.length}
                  aria-selected={stepper.current.id === step.id}
                  className="flex size-10 items-center justify-center rounded-full"
                  onClick={() => stepper.goTo(step.id)}
                >
                  {index + 1}
                </Button>
                <span className="text-sm font-medium">{step.title}</span>
              </li>
              {index < array.length - 1 && (
                <Separator
                  className={`flex-1 ${
                    index < currentIndex ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </ol>
      </nav>
      <div className="flex-1 flex flex-col min-h-0 w-[80%] mx-auto">
        <div className="flex-1 overflow-auto">
          {stepper.switch({
            upload: () => (
              <UploadDocument
                onActionStart={handleActionStart}
                onActionEnd={handleActionEnd}
                onActionSuccess={(fileIds) =>
                  setUploadFileData((prev) => ({ ...prev, fileids: fileIds }))
                }
              />
            ),
            'chunking-strategy': () => (
              <ChunkingStrategy
                chunkingStrategy={uploadFileData.chunkingStrategy}
                onUpdate={(chunkingStrategy) =>
                  setUploadFileData((prev) => ({ ...prev, chunkingStrategy }))
                }
              />
            ),
            'data-processing': () => <DataProcessing />,
          })}
        </div>
        <div className="shrink-0 pt-4 pb-6">
          {!stepper.isLast && (
            <div className="flex justify-end gap-4">
              <Button
                variant="secondary"
                onClick={stepper.prev}
                disabled={stepper.isFirst || !canChangePage}
              >
                Back
              </Button>
              <Button onClick={stepper.next} disabled={!canChangePage}>
                {stepper.isLast ? 'Complete' : 'Next'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadFilePage;
