'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
};

const Sidebar = ({ className }: Props) => {
  const router = useRouter();
  const handleLogout = async () => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          toast.success('Logged out successfully');
          router.push('/login');
        },
      },
    });
  };

  return (
    <aside className={cn(className)}>
      <Button onClick={handleLogout}>Logout</Button>
    </aside>
  );
};

export default Sidebar;
