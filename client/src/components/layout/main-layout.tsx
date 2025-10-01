import { ReactNode, useState, useEffect } from "react";
import Sidebar from "./sidebar";
import Header from "./header";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  onSearch?: (query: string) => void;
}

export default function MainLayout({ children, title, onSearch }: MainLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('desktopSidebarCollapsed');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const isMobile = useIsMobile();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('desktopSidebarCollapsed', JSON.stringify(isDesktopSidebarCollapsed));
    }
  }, [isDesktopSidebarCollapsed]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
    }
  };
  
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile Overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar}
        isMobile={isMobile}
        isCollapsed={isDesktopSidebarCollapsed}
      />
      
      <div className="flex-1 overflow-hidden">
        <Header 
          title={title} 
          onSearch={onSearch} 
          onMenuClick={toggleSidebar}
          isMobile={isMobile}
        />
        <main className="flex-1 overflow-auto h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
