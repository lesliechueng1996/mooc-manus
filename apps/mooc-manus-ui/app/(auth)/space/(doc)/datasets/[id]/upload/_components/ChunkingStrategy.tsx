'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputTags } from '@/components/ui/input-tag';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type ChunkingStrategyType = {
  processType: 'automatic' | 'custom';
  rule?: {
    preProcessRules?: Array<{
      id: 'remove_extra_space' | 'remove_url_and_email';
      enabled: boolean;
    }>;
    segment?: {
      separators?: Array<string>;
      chunkSize?: number;
      chunkOverlap?: number;
    };
  };
};

type Props = {
  chunkingStrategy: ChunkingStrategyType;
  onUpdate: (chunkingStrategy: ChunkingStrategyType) => void;
};

const ChunkingStrategy = ({ chunkingStrategy, onUpdate }: Props) => {
  const handleCardClick = (processType: 'automatic' | 'custom') => () => {
    onUpdate({ ...chunkingStrategy, processType });
  };

  const handleSeparatorsChange: React.Dispatch<
    React.SetStateAction<string[]>
  > = (separators) => {
    const newSeparators =
      typeof separators === 'function'
        ? separators(chunkingStrategy.rule?.segment?.separators ?? [])
        : separators;
    onUpdate({
      ...chunkingStrategy,
      rule: {
        ...chunkingStrategy.rule,
        segment: {
          ...chunkingStrategy.rule?.segment,
          separators: newSeparators,
        },
      },
    });
  };

  const handleChunkSizeChange = (chunkSize: number) => {
    onUpdate({
      ...chunkingStrategy,
      rule: {
        ...chunkingStrategy.rule,
        segment: {
          ...chunkingStrategy.rule?.segment,
          chunkSize,
        },
      },
    });
  };

  const handleChunkOverlapChange = (chunkOverlap: number) => {
    onUpdate({
      ...chunkingStrategy,
      rule: {
        ...chunkingStrategy.rule,
        segment: {
          ...chunkingStrategy.rule?.segment,
          chunkOverlap,
        },
      },
    });
  };

  const handleCheckboxChange =
    (id: 'remove_extra_space' | 'remove_url_and_email') =>
    (checked: boolean) => {
      const currentRules = chunkingStrategy.rule?.preProcessRules ?? [];
      const updatedRules = currentRules.map((rule) =>
        rule.id === id ? { ...rule, enabled: checked } : rule,
      );

      if (!currentRules.some((rule) => rule.id === id)) {
        updatedRules.push({ id, enabled: checked });
      }

      onUpdate({
        ...chunkingStrategy,
        rule: {
          ...chunkingStrategy.rule,
          preProcessRules: updatedRules,
        },
      });
    };

  return (
    <div className="space-y-8">
      <Card
        className={cn(
          chunkingStrategy.processType === 'automatic' && 'border-primary',
        )}
        onClick={handleCardClick('automatic')}
      >
        <CardHeader>
          <CardTitle>Automatic Chunking and Cleaning</CardTitle>
          <CardDescription>
            Automatically segment and preprocess your documents.
          </CardDescription>
        </CardHeader>
      </Card>
      <Card
        className={cn(
          chunkingStrategy.processType === 'custom' && 'border-primary',
        )}
        onClick={handleCardClick('custom')}
      >
        <CardHeader>
          <CardTitle>Custom</CardTitle>
          <CardDescription>
            Customize chunking rules, chunk size, and preprocessing rules
          </CardDescription>
        </CardHeader>
        {chunkingStrategy.processType === 'custom' && (
          <>
            <Separator />
            <CardContent onClick={(e) => e.stopPropagation()}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="chunk-separators">
                    Chunk Separators
                    <span className="text-red-500">*</span>
                  </FieldLabel>
                  <InputTags
                    id="chunk-separators"
                    required
                    placeholder="Enter chunk separators"
                    value={chunkingStrategy.rule?.segment?.separators ?? []}
                    onChange={handleSeparatorsChange}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="chunk-max-length">
                    Chunk Max Length
                    <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="chunk-max-length"
                    required
                    placeholder="Enter a number between 100 and 1000"
                    type="number"
                    value={chunkingStrategy.rule?.segment?.chunkSize ?? ''}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10);
                      if (!Number.isNaN(value)) {
                        handleChunkSizeChange(value);
                      }
                    }}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="chunk-max-length">
                    Chunk Overlap
                    <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id="chunk-overlap"
                    required
                    placeholder="Enter a number between 0 and the half of the chunk size"
                    type="number"
                    value={chunkingStrategy.rule?.segment?.chunkOverlap ?? ''}
                    onChange={(e) => {
                      const value = Number.parseInt(e.target.value, 10);
                      if (!Number.isNaN(value)) {
                        handleChunkOverlapChange(value);
                      }
                    }}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="text-preprocessing-rules">
                    Text Preprocessing Rules
                  </FieldLabel>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="replace-extra-space"
                      checked={
                        chunkingStrategy.rule?.preProcessRules?.find(
                          (rule) => rule.id === 'remove_extra_space',
                        )?.enabled ?? false
                      }
                      onCheckedChange={handleCheckboxChange(
                        'remove_extra_space',
                      )}
                    />
                    <Label htmlFor="replace-extra-space">
                      Replace consecutive spaces, line breaks, and tabs
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="remove-url-and-email"
                      checked={
                        chunkingStrategy.rule?.preProcessRules?.find(
                          (rule) => rule.id === 'remove_url_and_email',
                        )?.enabled ?? false
                      }
                      onCheckedChange={handleCheckboxChange(
                        'remove_url_and_email',
                      )}
                    />
                    <Label htmlFor="remove-url-and-email">
                      Remove all URLs and email addresses
                    </Label>
                  </div>
                </Field>
              </FieldGroup>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default ChunkingStrategy;
