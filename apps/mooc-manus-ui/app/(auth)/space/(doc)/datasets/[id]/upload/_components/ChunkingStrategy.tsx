'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
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
import { toast } from 'sonner';

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

export type ChunkingStrategyRef = {
  validate: () => boolean;
};

type Props = {
  chunkingStrategy: ChunkingStrategyType;
  onUpdate: (chunkingStrategy: ChunkingStrategyType) => void;
};

const ChunkingStrategy = forwardRef<ChunkingStrategyRef, Props>(
  ({ chunkingStrategy, onUpdate }, ref) => {
    const [chunkSizeInput, setChunkSizeInput] = useState<string>(
      chunkingStrategy.rule?.segment?.chunkSize?.toString() ?? '',
    );
    const [chunkOverlapInput, setChunkOverlapInput] = useState<string>(
      chunkingStrategy.rule?.segment?.chunkOverlap?.toString() ?? '',
    );

    const separatorsInputRef = useRef<HTMLInputElement>(null);
    const chunkSizeInputRef = useRef<HTMLInputElement>(null);
    const chunkOverlapInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
      const chunkSize = chunkingStrategy.rule?.segment?.chunkSize;
      const chunkOverlap = chunkingStrategy.rule?.segment?.chunkOverlap;
      if (chunkSize !== undefined) {
        setChunkSizeInput(chunkSize.toString());
      }
      if (chunkOverlap !== undefined) {
        setChunkOverlapInput(chunkOverlap.toString());
      }
    }, [
      chunkingStrategy.rule?.segment?.chunkSize,
      chunkingStrategy.rule?.segment?.chunkOverlap,
    ]);

    const validate = (): boolean => {
      if (chunkingStrategy.processType === 'automatic') {
        return true;
      }

      const separators = chunkingStrategy.rule?.segment?.separators ?? [];

      if (separators.length === 0) {
        separatorsInputRef.current?.focus();
        toast.error('Chunk separators is required');
        return false;
      }

      const chunkSizeNum = Number.parseInt(chunkSizeInput, 10);
      if (
        chunkSizeInput === '' ||
        Number.isNaN(chunkSizeNum) ||
        chunkSizeNum < 100 ||
        chunkSizeNum > 1000
      ) {
        chunkSizeInputRef.current?.focus();
        toast.error('Chunk size must be between 100 and 1000');
        return false;
      }
      if (chunkingStrategy.rule?.segment?.chunkSize !== chunkSizeNum) {
        handleChunkSizeChange(chunkSizeNum);
      }

      const chunkOverlapNum = Number.parseInt(chunkOverlapInput, 10);
      if (
        chunkOverlapInput === '' ||
        Number.isNaN(chunkOverlapNum) ||
        chunkOverlapNum < 0 ||
        chunkOverlapNum > chunkSizeNum / 2
      ) {
        chunkOverlapInputRef.current?.focus();
        toast.error(
          'Chunk overlap must be between 0 and the half of the chunk size',
        );
        return false;
      }
      if (chunkingStrategy.rule?.segment?.chunkOverlap !== chunkOverlapNum) {
        handleChunkOverlapChange(chunkOverlapNum);
      }

      return true;
    };

    useImperativeHandle(ref, () => ({
      validate,
    }));
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

    const handleChunkSizeInputChange = (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const value = e.target.value;
      setChunkSizeInput(value);

      const numValue = Number.parseInt(value, 10);
      if (value !== '' && !Number.isNaN(numValue)) {
        handleChunkSizeChange(numValue);
      }
    };

    const handleChunkSizeBlur = () => {
      const numValue = Number.parseInt(chunkSizeInput, 10);
      if (chunkSizeInput === '' || Number.isNaN(numValue)) {
        setChunkSizeInput('');
      } else {
        handleChunkSizeChange(numValue);
      }
    };

    const handleChunkOverlapInputChange = (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const value = e.target.value;
      setChunkOverlapInput(value);

      const numValue = Number.parseInt(value, 10);
      if (value !== '' && !Number.isNaN(numValue)) {
        handleChunkOverlapChange(numValue);
      }
    };

    const handleChunkOverlapBlur = () => {
      const numValue = Number.parseInt(chunkOverlapInput, 10);
      if (chunkOverlapInput === '' || Number.isNaN(numValue)) {
        setChunkOverlapInput('');
      } else {
        handleChunkOverlapChange(numValue);
      }
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
                      ref={separatorsInputRef}
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
                      ref={chunkSizeInputRef}
                      id="chunk-max-length"
                      required
                      placeholder="Enter a number between 100 and 1000"
                      type="number"
                      value={chunkSizeInput}
                      onChange={handleChunkSizeInputChange}
                      onBlur={handleChunkSizeBlur}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="chunk-overlap">
                      Chunk Overlap
                      <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      ref={chunkOverlapInputRef}
                      id="chunk-overlap"
                      required
                      placeholder="Enter a number between 0 and the half of the chunk size"
                      type="number"
                      value={chunkOverlapInput}
                      onChange={handleChunkOverlapInputChange}
                      onBlur={handleChunkOverlapBlur}
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
  },
);

ChunkingStrategy.displayName = 'ChunkingStrategy';

export default ChunkingStrategy;
