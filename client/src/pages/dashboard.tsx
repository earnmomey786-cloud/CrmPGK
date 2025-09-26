import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  UserPlus, 
  Plus, 
  Users, 
  ListChecks, 
  ArrowRight, 
  User,
  Phone,
  Mail,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import MainLayout from "@/components/layout/main-layout";
import NewClientModal from "@/components/modals/new-client-modal";
import NewTaskModal from "@/components/modals/new-task-modal";
import ViewClientModal from "@/components/modals/view-client-modal";
import ViewTaskModal from "@/components/modals/view-task-modal";
import { Link } from "wouter";
import type { DashboardStats } from "@/lib/types";
import type { ClientWithCategory, TaskWithClient } from "@shared/schema";

const pipelineStages = [
  { key: "nuevo", label: "Nuevo", color: "bg-chart-1" },
  { key: "presupuesto-enviado", label: "Presupuesto Enviado", color: "bg-chart-2" },
  { key: "presupuesto-pagado", label: "Presupuesto Pagado", color: "bg-chart-3" },
  { key: "en-tareas", label: "En Tareas", color: "bg-chart-4" },
  { key: "terminado", label: "Terminado", color: "bg-chart-5" },
];

const priorityColors = {
  baja: "bg-chart-2/20 text-chart-2",
  media: "bg-chart-3/20 text-chart-3",
  alta: "bg-chart-4/20 text-chart-4",
  urgente: "bg-destructive/20 text-destructive",
};

const statusColors = {
  nuevo: "bg-chart-1/20 text-chart-1",
  "presupuesto-enviado": "bg-chart-2/20 text-chart-2",
  "presupuesto-pagado": "bg-chart-3/20 text-chart-3",
  "en-tareas": "bg-chart-4/20 text-chart-4",
  "terminado": "bg-chart-5/20 text-chart-5",
};

export default function Dashboard() {
  const [showNewClient, setShowNewClient] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [viewingClient, setViewingClient] = useState<ClientWithCategory | null>(null);
  const [viewingTask, setViewingTask] = useState<TaskWithClient | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const { data: recentClients = [], isLoading: clientsLoading } = useQuery<ClientWithCategory[]>({
    queryKey: ["/api/clients"],
    select: (data) => data.slice(0, 3).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    ),
  });

  const { data: pendingTasks = [], isLoading: tasksLoading } = useQuery<TaskWithClient[]>({
    queryKey: ["/api/tasks?pending=true"],
    select: (data) => data.slice(0, 3),
  });

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `Hace ${days} día${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
    } else {
      return "Hace pocos minutos";
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "whatsapp":
        return <MessageSquare className="h-4 w-4 text-chart-2" />;
      case "email":
        return <Mail className="h-4 w-4 text-chart-3" />;
      case "telefono":
        return <Phone className="h-4 w-4 text-chart-4" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <MainLayout title="Dashboard">
      <div className="p-2 sm:p-3 lg:p-6">
        {/* Action Buttons Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Button
            onClick={() => setShowNewClient(true)}
            className="p-3 sm:p-6 h-auto bg-primary hover:bg-primary/90 text-primary-foreground flex flex-col items-center space-y-2 sm:space-y-3 group"
            data-testid="button-new-client"
          >
            <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-xs sm:text-sm">Nuevo Cliente</span>
          </Button>
          
          <Button
            onClick={() => setShowNewTask(true)}
            className="p-3 sm:p-6 h-auto bg-secondary hover:bg-secondary/90 text-secondary-foreground flex flex-col items-center space-y-2 sm:space-y-3 group"
            data-testid="button-new-task"
          >
            <Plus className="h-6 w-6 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform" />
            <span className="font-semibold text-xs sm:text-sm">Nueva Tarea</span>
          </Button>
          
          <Link href="/clients">
            <Button
              className="w-full p-3 sm:p-6 h-auto bg-accent hover:bg-accent/90 text-accent-foreground flex flex-col items-center space-y-2 sm:space-y-3 group"
              data-testid="button-view-clients"
            >
              <Users className="h-6 w-6 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-xs sm:text-sm">Ver Clientes</span>
            </Button>
          </Link>
          
          <Link href="/tasks">
            <Button
              className="w-full p-3 sm:p-6 h-auto bg-muted hover:bg-muted/90 text-muted-foreground flex flex-col items-center space-y-2 sm:space-y-3 group"
              data-testid="button-view-tasks"
            >
              <ListChecks className="h-6 w-6 sm:h-8 sm:w-8 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-xs sm:text-sm">Ver Tareas</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Pipeline Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pipeline de Ventas</CardTitle>
                <Link href="/pipeline">
                  <Button variant="ghost" size="sm" data-testid="button-view-pipeline">
                    Ver todo <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="bg-background p-2 sm:p-4 rounded-lg border animate-pulse">
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-8 bg-muted rounded mb-1"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
                    {pipelineStages.map((stage) => (
                      <div key={stage.key} className="bg-background p-2 sm:p-4 rounded-lg border border-border">
                        <h4 className="text-xs sm:text-sm font-medium text-foreground mb-1 sm:mb-2">{stage.label}</h4>
                        <div className={`text-lg sm:text-2xl font-bold mb-1 ${stage.color.replace('bg-', 'text-')}`} data-testid={`stat-${stage.key}`}>
                          {stats?.pipelineStats[stage.key as keyof typeof stats.pipelineStats] || 0}
                        </div>
                        <div className="text-xs text-muted-foreground">clientes</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Quick Stats */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Estadísticas Rápidas</CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="h-4 bg-muted rounded w-24"></div>
                        <div className="h-4 bg-muted rounded w-12"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Clientes</span>
                      <span className="font-semibold text-foreground" data-testid="stat-total-clients">
                        {stats?.totalClients || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Tareas Pendientes</span>
                      <span className="font-semibold text-destructive" data-testid="stat-pending-tasks">
                        {stats?.pendingTasks || 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recent Clients */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Últimos Clientes</CardTitle>
              <Link href="/clients">
                <Button variant="ghost" size="sm" data-testid="button-view-all-clients">
                  Ver todos <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {clientsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-background rounded-lg border animate-pulse">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div>
                          <div className="h-4 bg-muted rounded w-24 mb-1"></div>
                          <div className="h-3 bg-muted rounded w-32"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-6 bg-muted rounded w-16 mb-1"></div>
                        <div className="h-3 bg-muted rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentClients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay clientes registrados aún.</p>
                  <Button
                    onClick={() => setShowNewClient(true)}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Crear primer cliente
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentClients.map((client) => (
                    <div 
                      key={client.id} 
                      className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors" 
                      data-testid={`client-card-${client.id}`}
                      onClick={() => setViewingClient(client)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge 
                          className={statusColors[client.status as keyof typeof statusColors]}
                          data-testid={`client-status-${client.id}`}
                        >
                          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatRelativeTime(client.createdAt!)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Pending Tasks */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tareas Pendientes</CardTitle>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" data-testid="button-view-all-tasks">
                  Ver todas <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {tasksLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 bg-background rounded-lg border animate-pulse">
                      <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-full mb-1"></div>
                        <div className="h-3 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="flex justify-between">
                          <div className="h-5 bg-muted rounded w-16"></div>
                          <div className="h-3 bg-muted rounded w-12"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay tareas pendientes.</p>
                  <Button
                    onClick={() => setShowNewTask(true)}
                    variant="outline"
                    size="sm"
                    className="mt-4"
                  >
                    Crear primera tarea
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTasks.map((task) => (
                    <div 
                      key={task.id} 
                      className="flex items-start space-x-3 p-3 bg-background rounded-lg border border-border hover:bg-accent cursor-pointer transition-colors" 
                      data-testid={`task-card-${task.id}`}
                      onClick={() => setViewingTask(task)}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        task.priority === 'urgente' ? 'bg-destructive' :
                        task.priority === 'alta' ? 'bg-chart-4' :
                        task.priority === 'media' ? 'bg-chart-3' : 'bg-chart-2'
                      }`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.client ? `Cliente: ${task.client.name}` : 'Sin cliente asignado'}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge 
                            className={priorityColors[task.priority as keyof typeof priorityColors]}
                            data-testid={`task-priority-${task.id}`}
                          >
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {task.dueDate ? 
                              `Vence ${formatRelativeTime(task.dueDate)}` : 
                              'Sin fecha límite'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <NewClientModal
          open={showNewClient}
          onOpenChange={setShowNewClient}
        />

        <NewTaskModal
          open={showNewTask}
          onOpenChange={setShowNewTask}
        />

        <ViewClientModal
          open={!!viewingClient}
          onOpenChange={(open) => !open && setViewingClient(null)}
          client={viewingClient}
        />

        <ViewTaskModal
          open={!!viewingTask}
          onOpenChange={(open) => !open && setViewingTask(null)}
          task={viewingTask}
        />
      </div>
    </MainLayout>
  );
}
