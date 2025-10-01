import { useState, useMemo, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Calendar,
  User,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Download
} from "lucide-react";
import * as XLSX from 'xlsx';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MainLayout from "@/components/layout/main-layout";
import NewTaskModal from "@/components/modals/new-task-modal";
import ViewTaskModal from "@/components/modals/view-task-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { TaskWithClient, ClientWithCategory, Category } from "@shared/schema";
import { format } from "date-fns";

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

const ITEMS_PER_PAGE = 10;

export default function Tasks() {
  const [showNewTask, setShowNewTask] = useState(false);
  const [viewingTask, setViewingTask] = useState<TaskWithClient | null>(null);
  const [editingTask, setEditingTask] = useState<TaskWithClient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  const isMobile = useIsMobile();
  const [location, setLocation] = useLocation();
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<TaskWithClient[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: clients = [] } = useQuery<ClientWithCategory[]>({
    queryKey: ["/api/clients"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const openTaskId = params.get('openTask');
    
    if (openTaskId && tasks.length > 0) {
      const taskToOpen = tasks.find(t => t.id === openTaskId);
      if (taskToOpen) {
        setViewingTask(taskToOpen);
        setLocation('/tasks');
      }
    }
  }, [location, tasks, setLocation]);

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/count"] });
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea.",
        variant: "destructive",
      });
    },
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.client?.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
      const matchesCategory = categoryFilter === "all" || task.client?.categoryId === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    });
  }, [tasks, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedTasks = filteredTasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleDeleteTask = (id: string, title: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la tarea "${title}"?`)) {
      deleteTaskMutation.mutate(id);
    }
  };

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

  const handleExportToExcel = () => {
    const exportData = filteredTasks.map(task => ({
      'Título': task.title,
      'Cliente': task.client?.name || '',
      'Prioridad': priorityLabels[task.priority as keyof typeof priorityLabels] || task.priority,
      'Estado': statusLabels[task.status as keyof typeof statusLabels] || task.status,
      'Fecha Vencimiento': task.dueDate ? format(new Date(task.dueDate), "dd/MM/yyyy HH:mm") : '',
      'Descripción': task.description || '',
      'Fecha Creación': task.createdAt ? format(new Date(task.createdAt), "dd/MM/yyyy HH:mm") : '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tareas');
    
    const fileName = `tareas_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: "Exportación exitosa",
      description: `${filteredTasks.length} tarea${filteredTasks.length !== 1 ? 's' : ''} exportada${filteredTasks.length !== 1 ? 's' : ''} a Excel.`,
    });
  };

  return (
    <MainLayout title="Gestión de Tareas" onSearch={setSearchQuery}>
      <div className="p-2 sm:p-3 lg:p-6 pb-20 sm:pb-24 lg:pb-32">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Gestión de Tareas</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleExportToExcel}
              disabled={filteredTasks.length === 0}
              data-testid="button-export-tasks"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button 
              onClick={() => {
                setEditingTask(null);
                setShowNewTask(true);
              }}
              data-testid="button-new-task-page"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nueva Tarea
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Título, descripción, cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-tasks"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Estado</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger data-testid="select-filter-status">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="en-progreso">En Progreso</SelectItem>
                    <SelectItem value="completada">Completada</SelectItem>
                    <SelectItem value="cancelada">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Prioridad</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger data-testid="select-filter-priority">
                    <SelectValue placeholder="Todas las prioridades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las prioridades</SelectItem>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Categoría</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger data-testid="select-filter-category">
                    <SelectValue placeholder="Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <div className="animate-pulse space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded"></div>
                  ))}
                </div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter || priorityFilter || categoryFilter
                    ? "No se encontraron tareas con los filtros aplicados."
                    : "No hay tareas registradas aún."
                  }
                </p>
                <Button onClick={() => {
                  setEditingTask(null);
                  setShowNewTask(true);
                }}>
                  Crear primera tarea
                </Button>
              </div>
            ) : isMobile ? (
              // Mobile card layout
              <div className="space-y-4 p-4">
                {paginatedTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="bg-background rounded-lg border border-border p-4"
                    data-testid={`task-card-${task.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground mb-1">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        {task.client && (
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{task.client.name}</span>
                          </div>
                        )}
                        {task.assignedUserName && (
                          <div className="flex items-center space-x-2 mb-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="text-sm text-primary font-medium">Asignado a: {task.assignedUserName}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setViewingTask(task)}
                          data-testid={`button-view-task-${task.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setEditingTask(task)}
                          data-testid={`button-edit-task-${task.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteTask(task.id, task.title)}
                          className="text-destructive hover:text-destructive"
                          data-testid={`button-delete-task-${task.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          className={statusColors[task.status as keyof typeof statusColors]}
                          data-testid={`task-status-badge-${task.id}`}
                        >
                          {statusLabels[task.status as keyof typeof statusLabels]}
                        </Badge>
                        <Badge 
                          className={priorityColors[task.priority as keyof typeof priorityColors]}
                          data-testid={`task-priority-badge-${task.id}`}
                        >
                          {priorityLabels[task.priority as keyof typeof priorityLabels]}
                        </Badge>
                      </div>
                      <div className="text-right">
                        {task.dueDate ? (
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{format(new Date(task.dueDate), "dd/MM")}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin fecha</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Desktop table layout
              <div className="overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tarea</TableHead>
                      <TableHead className="hidden md:table-cell">Cliente</TableHead>
                      <TableHead className="hidden lg:table-cell">Asignado a</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden lg:table-cell">Prioridad</TableHead>
                      <TableHead className="hidden lg:table-cell">Fecha Límite</TableHead>
                      <TableHead className="hidden md:table-cell">Última Act.</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTasks.map((task) => (
                      <TableRow key={task.id} data-testid={`task-row-${task.id}`}>
                        <TableCell>
                          <div>
                            <div className="text-sm font-medium text-foreground">{task.title}</div>
                            {task.description && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {task.description}
                              </div>
                            )}
                            {task.client && (
                              <div className="md:hidden text-xs text-muted-foreground mt-1 flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {task.client.name}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {task.client ? (
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center mr-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="text-sm text-foreground">{task.client.name}</div>
                                <div className="text-xs text-muted-foreground">{task.client.email}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin cliente</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {task.assignedUserName ? (
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-2">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              <span className="text-sm text-foreground">{task.assignedUserName}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin asignar</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={statusColors[task.status as keyof typeof statusColors]}
                            data-testid={`task-status-badge-${task.id}`}
                          >
                            {statusLabels[task.status as keyof typeof statusLabels]}
                          </Badge>
                          <div className="lg:hidden mt-1">
                            <Badge 
                              className={priorityColors[task.priority as keyof typeof priorityColors]}
                              data-testid={`task-priority-badge-${task.id}`}
                            >
                              {priorityLabels[task.priority as keyof typeof priorityLabels]}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Badge 
                            className={priorityColors[task.priority as keyof typeof priorityColors]}
                            data-testid={`task-priority-badge-${task.id}`}
                          >
                            {priorityLabels[task.priority as keyof typeof priorityLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {task.dueDate ? (
                            <div className="flex items-center text-sm">
                              <Calendar className="h-4 w-4 mr-1 text-muted-foreground" />
                              <span>{format(new Date(task.dueDate), "dd/MM/yyyy")}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Sin fecha</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {formatRelativeTime(task.updatedAt!)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setViewingTask(task)}
                              data-testid={`button-view-task-${task.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingTask(task)}
                              data-testid={`button-edit-task-${task.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-task-${task.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            
            {/* Pagination */}
            {filteredTasks.length > 0 && (
              <div className="bg-muted px-6 py-3 flex items-center justify-between border-t border-border">
                <div className="text-sm text-muted-foreground" data-testid="pagination-info">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredTasks.length)} de {filteredTasks.length} tareas
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          data-testid={`button-page-${page}`}
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    data-testid="button-next-page"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <NewTaskModal
          open={showNewTask || !!editingTask}
          onOpenChange={(open) => {
            if (!open) {
              setShowNewTask(false);
              setEditingTask(null);
            }
          }}
          editingTask={editingTask}
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
