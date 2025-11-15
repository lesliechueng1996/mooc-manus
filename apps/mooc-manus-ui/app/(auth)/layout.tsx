import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { auth } from '@/lib/auth';
import Sidebar from './_components/Sidebar';

type Props = {
  children: ReactNode;
};

const AuthLayout = async ({ children }: Props) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="h-screen w-screen flex">
      <Sidebar className="w-80 h-full" />

      <div className="flex-1">{children}</div>
    </div>
  );
};

export default AuthLayout;
