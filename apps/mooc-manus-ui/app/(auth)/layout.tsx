import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { CSSProperties, ReactNode } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@/lib/auth';
import AppSidebar from './_components/AppSidebar';

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
    <SidebarProvider
      style={
        {
          '--sidebar-width': '20rem',
        } as CSSProperties
      }
    >
      <AppSidebar />

      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
};

export default AuthLayout;
