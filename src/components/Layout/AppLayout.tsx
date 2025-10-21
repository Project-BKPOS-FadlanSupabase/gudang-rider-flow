import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { BottomNavigation } from "./BottomNavigation";
import { useIsMobile } from "@/hooks/use-mobile";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {!isMobile && <AppSidebar />}
        <main className={`flex-1 bg-background p-4 md:p-6 overflow-auto ${isMobile ? 'pb-20' : ''}`}>
          {children}
        </main>
        {isMobile && <BottomNavigation />}
      </div>
    </SidebarProvider>
  );
}
