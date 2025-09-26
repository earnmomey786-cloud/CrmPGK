import { Search, Bell, Settings, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  onSearch?: (query: string) => void;
  onMenuClick?: () => void;
  isMobile?: boolean;
}

export default function Header({ title, onSearch, onMenuClick, isMobile }: HeaderProps) {
  return (
    <header className="h-16 bg-card border-b border-border px-3 sm:px-6 flex items-center justify-between">
      <div className="flex items-center space-x-2 sm:space-x-4">
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onMenuClick}
            className="mr-2"
            data-testid="button-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <h2 className="text-lg sm:text-xl font-semibold text-card-foreground">{title}</h2>
        <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Última actualización:</span>
          <span>Hace 2 minutos</span>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="relative hidden sm:block">
          <Input
            type="text"
            placeholder="Buscar clientes, tareas..."
            className="w-60 lg:w-80"
            onChange={(e) => onSearch?.(e.target.value)}
            data-testid="input-global-search"
          />
          <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
        
        <Button variant="ghost" size="icon" className="relative hidden sm:flex" data-testid="button-notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
            3
          </span>
        </Button>
        
        <Button variant="ghost" size="icon" className="hidden sm:flex" data-testid="button-settings">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
