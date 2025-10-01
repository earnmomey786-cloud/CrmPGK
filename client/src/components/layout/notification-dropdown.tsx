import { useState } from "react";
import { Bell, Edit3, Clock, User, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";
import type { TaskWithClient } from "@shared/schema";

interface NotificationDropdownProps {
  notificationCount: number;
}

export default function NotificationDropdown({ notificationCount }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingPhrase, setIsEditingPhrase] = useState(false);
  const [phraseInput, setPhraseInput] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Query for pending tasks
  const { data: pendingTasks = [], isLoading: tasksLoading } = useQuery<TaskWithClient[]>({
    queryKey: ['/api/notifications/tasks'],
    enabled: isOpen,
  });

  // Query for motivational phrase
  const { data: phraseData, isLoading: phraseLoading } = useQuery<{ phrase: string }>({
    queryKey: ['/api/motivational-phrase'],
    enabled: isOpen,
  });

  // Mutation for updating phrase
  const updatePhraseMutation = useMutation({
    mutationFn: async (phrase: string) => {
      const response = await apiRequest("PUT", "/api/motivational-phrase", { phrase });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/motivational-phrase'] });
      setIsEditingPhrase(false);
      setPhraseInput("");
      toast({
        title: "Frase actualizada",
        description: "Tu frase motivacional ha sido actualizada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la frase motivacional.",
        variant: "destructive",
      });
    },
  });

  const handleEditPhrase = () => {
    setPhraseInput(phraseData?.phrase || "");
    setIsEditingPhrase(true);
  };

  const handleSavePhrase = () => {
    if (phraseInput.trim()) {
      updatePhraseMutation.mutate(phraseInput.trim());
    }
  };

  const handleCancelEdit = () => {
    setIsEditingPhrase(false);
    setPhraseInput("");
  };

  const handleTaskClick = (taskId: string) => {
    setIsOpen(false);
    setLocation(`/tasks?openTask=${taskId}`);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="button-notifications"
        >
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span 
              className="absolute -top-1 -right-1 min-w-4 h-4 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center px-1" 
              data-testid="notification-count"
            >
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" data-testid="notification-dropdown">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Notificaciones</h3>
            <Badge variant="secondary" className="text-xs">
              {notificationCount} pendiente{notificationCount !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Motivational Phrase Section */}
          <div className="mb-4 p-3 bg-primary/5 rounded-lg border">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs">💪</span>
                </div>
                <span className="text-xs font-medium text-muted-foreground">Frase del día</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={handleEditPhrase}
                disabled={isEditingPhrase}
                data-testid="button-edit-phrase"
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>

            {isEditingPhrase ? (
              <div className="space-y-2">
                <Input
                  value={phraseInput}
                  onChange={(e) => setPhraseInput(e.target.value)}
                  placeholder="Escribe tu frase motivacional..."
                  className="text-sm"
                  data-testid="input-phrase"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSavePhrase}
                    disabled={!phraseInput.trim() || updatePhraseMutation.isPending}
                    className="text-xs h-7"
                    data-testid="button-save-phrase"
                  >
                    Guardar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="text-xs h-7"
                    data-testid="button-cancel-phrase"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-primary font-medium" data-testid="current-phrase">
                {phraseLoading ? "Cargando..." : phraseData?.phrase || "¡Vamos por un día productivo! 💪"}
              </p>
            )}
          </div>

          <Separator className="my-3" />

          {/* Pending Tasks Section */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
              Tareas Pendientes
            </h4>
            
            {tasksLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted rounded-md animate-pulse" />
                ))}
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="text-center py-6">
                <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">¡Genial! No tienes tareas pendientes</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleTaskClick(task.id)}
                    data-testid={`task-notification-${task.id}`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <h5 className="text-sm font-medium truncate pr-2">{task.title}</h5>
                      {task.priority && (
                        <Badge
                          variant={task.priority === 'alta' || task.priority === 'urgente' ? 'destructive' : 'secondary'}
                          className="text-xs shrink-0"
                        >
                          {task.priority}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {task.client && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate">{task.client.name}</span>
                        </div>
                      )}
                      
                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(task.dueDate), "dd/MM/yyyy HH:mm")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}