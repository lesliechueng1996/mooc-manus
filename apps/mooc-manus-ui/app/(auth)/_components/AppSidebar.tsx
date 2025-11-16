'use client';

import { PanelLeft, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import NavUser from './NavUser';

type Props = {
  className?: string;
};

const AppSidebar = ({ className }: Props) => {
  const { toggleSidebar, open } = useSidebar();

  return (
    <Sidebar className={cn(className)} variant="floating" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={toggleSidebar} asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Toggle Sidebar"
                className="flex justify-start"
              >
                {open ? <PanelLeft /> : <PanelLeftOpen />}
              </Button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tasks</SidebarGroupLabel>
          {/* TODO */}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
