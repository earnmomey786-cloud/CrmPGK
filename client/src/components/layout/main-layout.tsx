import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  onSearch?: (query: string) => void;
}

export default function MainLayout({ children, title, onSearch }: MainLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-hidden">
        <Header title={title} onSearch={onSearch} />
        <main className="flex-1 overflow-auto h-full">
          {children}
        </main>
      </div>
    </div>
  );
}
