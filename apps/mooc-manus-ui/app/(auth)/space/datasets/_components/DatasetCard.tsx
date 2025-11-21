'use client';

import type { ComponentProps } from 'react';
import BaseCard from '@/components/BaseCard';
import TimeCardFooter from '@/components/TimeCardFooter';
import DatasetCardHeader from './DatasetCardHeader';

type Props = {
  description: string;
  updatedAt: number;
  authorName: string;
  authorAvatar?: string;
} & ComponentProps<typeof DatasetCardHeader>;

const DatasetCard = ({
  description,
  updatedAt,
  authorAvatar,
  authorName,
  ...headerProps
}: Props) => {
  const header = <DatasetCardHeader {...headerProps} />;

  const footer = (
    <TimeCardFooter
      nickname={authorName}
      avatarSrc={authorAvatar}
      time={updatedAt}
      timeLabel="Last updated"
    />
  );

  return <BaseCard top={header} middle={description} bottom={footer} />;
};

export default DatasetCard;
