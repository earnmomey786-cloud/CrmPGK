import { Link, useLocation } from "wouter";
import { 
  Home, 
  Users, 
  CheckSquare, 
  BarChart3, 
  Tags, 
  FileBarChart, 
  User,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Tareas", href: "/tasks", icon: CheckSquare },
  { name: "Pipeline", href: "/pipeline", icon: BarChart3 },
  { name: "Categorías", href: "/categories", icon: Tags },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export default function Sidebar({ isOpen = false, onClose, isMobile = false }: SidebarProps) {
  const [location] = useLocation();

  const handleNavClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className={`
      w-64 bg-card border-r border-border flex-shrink-0 flex flex-col transition-transform duration-300 ease-in-out
      ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'relative'}
      ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}
    `}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-card-foreground">CRM PGK</h1>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden"
              data-testid="button-close-sidebar"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  onClick={handleNavClick}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="mt-auto p-6 border-t border-border">
        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
          <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-card-foreground">Admin Usuario</p>
            <p className="text-xs">admin@empresa.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
