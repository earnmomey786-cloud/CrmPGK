import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Clock, Flag } from "lucide-react";
import { format } from "date-fns";
import type { TaskWithClient } from "@shared/schema";

const priorityColors = {
  baja: "bg-chart-2/20 text-chart-2",
  media: "bg-chart-3/20 text-chart-3",
  alta: "bg-chart-4/20 text-chart-4",
  urgente: "bg-destructive/20 text-destructive",
};

const statusColors = {
  pendiente: "bg-yellow-500/20 text-yellow-600",
  "en-progreso": "bg-blue-500/20 text-blue-600",
  completada: "bg-green-500/20 text-green-600",
  cancelada: "bg-gray-500/20 text-gray-600",
};

const priorityLabels = {
  baja: "Baja",
  media: "Media",
  alta: "Alta",
  urgente: "Urgente",
};

const statusLabels = {
  pendiente: "Pendiente",
  "en-progreso": "En Progreso",
  completada: "Completada",
  cancelada: "Cancelada",
};

interface ViewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskWithClient | null;
}

export default function ViewTaskModal({ open, onOpenChange, task }: ViewTaskModalProps) {
  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl" data-testid="modal-task-title">
            {task.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Estado:</span>
              <Badge 
                className={statusColors[task.status as keyof typeof statusColors]}
                data-testid="task-status-badge"
              >
                {statusLabels[task.status as keyof typeof statusLabels]}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Prioridad:</span>
              <Badge 
                className={priorityColors[task.priority as keyof typeof priorityColors]}
                data-testid="task-priority-badge"
              >
                {priorityLabels[task.priority as keyof typeof priorityLabels]}
              </Badge>
            </div>
          </div>

          <Separator />

          {/* Client Information */}
          {task.client && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Cliente:</span>
              </div>
              <div className="ml-6 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium" data-testid="task-client-name">
                    {task.client.name}
                  </span>
                  {task.client.category && (
                    <Badge 
                      style={{ 
                        backgroundColor: `${task.client.category.color}20`,
                        color: task.client.category.color 
                      }}
                      data-testid="task-client-category"
                    >
                      {task.client.category.name}
                    </Badge>
                  )}
                </div>
                {task.client.email && (
                  <p className="text-sm text-muted-foreground" data-testid="task-client-email">
                    {task.client.email}
                  </p>
                )}
                {task.client.phone && (
                  <p className="text-sm text-muted-foreground" data-testid="task-client-phone">
                    {task.client.phone}
                  </p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">NIE:</span>
                  <span className="text-sm text-muted-foreground" data-testid="task-client-nie">
                    {task.client.nie || "No especificado"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!task.client && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sin cliente asignado</span>
            </div>
          )}

          <Separator />

          {/* Assigned User */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Asignado a:</span>
            </div>
            {task.assignedUserName ? (
              <div className="ml-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                  <span className="font-medium text-primary" data-testid="task-assigned-user">
                    {task.assignedUserName}
                  </span>
                </div>
              </div>
            ) : (
              <div className="ml-6 text-sm text-muted-foreground">Sin asignar</div>
            )}
          </div>

          <Separator />

          {/* Due Date */}
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Fecha de vencimiento:</span>
            {task.dueDate ? (
              <span className="text-sm" data-testid="task-due-date">
                {format(new Date(task.dueDate), "dd/MM/yyyy 'a las' HH:mm")}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">Sin fecha límite</span>
            )}
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Descripción:</h4>
            {task.description ? (
              <div 
                className="text-sm text-muted-foreground bg-muted p-4 rounded-md whitespace-pre-wrap"
                data-testid="task-description"
              >
                {task.description}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Sin descripción</p>
            )}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Creada:</span>
              <span className="text-muted-foreground" data-testid="task-created-date">
                {format(new Date(task.createdAt!), "dd/MM/yyyy HH:mm")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Actualizada:</span>
              <span className="text-muted-foreground" data-testid="task-updated-date">
                {format(new Date(task.updatedAt!), "dd/MM/yyyy HH:mm")}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}