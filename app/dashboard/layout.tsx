'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useIdeaStore } from '@/src/stores/ideaStore';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/src/components/AppSidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getActiveIdea } = useIdeaStore();
  const router = useRouter();
  const activeIdea = getActiveIdea();

  const isIdeaUnlocked = activeIdea && (activeIdea.verdict === 'VIABLE' || activeIdea.verdict === 'FIRE');

  useEffect(() => {
    if (!isIdeaUnlocked) {
      router.push('/');
    }
  }, [isIdeaUnlocked, router]);

  if (!isIdeaUnlocked) {
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div
        className="min-h-screen flex w-full bg-black relative"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(39,39,42,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(39,39,42,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0',
        }}
      >
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-zinc-800 flex items-center px-4">
            <SidebarTrigger />
          </header>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

