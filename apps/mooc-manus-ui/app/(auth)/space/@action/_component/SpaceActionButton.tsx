'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

type Props = {
  label: string;
};

const SpaceActionButton = ({ label }: Props) => {
  // const { openModal } = useModal();

  return (
    <Link href="/space/tools/create">
      <Button>{label}</Button>
    </Link>
  );
};

export default SpaceActionButton;
