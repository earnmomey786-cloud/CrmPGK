import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  User,
  Users,
  Phone,
  Mail,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
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
import NewClientModal from "@/components/modals/new-client-modal";
import ViewClientModal from "@/components/modals/view-client-modal";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { ClientWithCategory, Category } from "@shared/schema";

const statusColors = {
  nuevo: "bg-chart-1/20 text-chart-1",
  "presupuesto-enviado": "bg-chart-2/20 text-chart-2",
  "presupuesto-pagado": "bg-chart-3/20 text-chart-3",
  "en-tareas": "bg-chart-4/20 text-chart-4",
  "terminado": "bg-chart-5/20 text-chart-5",
};

const statusLabels = {
  nuevo: "Nuevo",
  "presupuesto-enviado": "Presupuesto Enviado", 
  "presupuesto-pagado": "Presupuesto Pagado",
  "en-tareas": "En Tareas",
  "terminado": "Terminado",
};

const channelIcons = {
  whatsapp: <MessageSquare className="h-4 w-4 text-chart-2" />,
  email: <Mail className="h-4 w-4 text-chart-3" />,
  telefono: <Phone className="h-4 w-4 text-chart-4" />,
  presencial: <User className="h-4 w-4 text-muted-foreground" />,
};

const ITEMS_PER_PAGE = 10;

export default function Clients() {
  const [showNewClient, setShowNewClient] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientWithCategory | null>(null);
  const [viewingClient, setViewingClient] = useState<ClientWithCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading } = useQuery<ClientWithCategory[]>({
    queryKey: ["/api/clients"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Cliente eliminado",
        description: "El cliente ha sido eliminado exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el cliente.",
        variant: "destructive",
      });
    },
  });

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch = !searchQuery || 
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.phone.includes(searchQuery) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = !statusFilter || client.status === statusFilter;
      const matchesCategory = !categoryFilter || client.categoryId === categoryFilter;
      const matchesChannel = !channelFilter || client.channel === channelFilter;
      
      return matchesSearch && matchesStatus && matchesCategory && matchesChannel;
    });
  }, [clients, searchQuery, statusFilter, categoryFilter, channelFilter]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleDeleteClient = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el cliente "${name}"?`)) {
      deleteClientMutation.mutate(id);
    }
  };

  const handleEditClient = (client: ClientWithCategory) => {
    setEditingClient(client);
  };

  const handleCloseModal = (open: boolean) => {
    if (!open) {
      setShowNewClient(false);
      setEditingClient(null);
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

  return (
    <MainLayout title="Gestión de Clientes" onSearch={setSearchQuery}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Gestión de Clientes</h2>
          <Button 
            onClick={() => setShowNewClient(true)}
            data-testid="button-new-client-page"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Cliente
          </Button>
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
                    placeholder="Nombre, email, teléfono..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    data-testid="input-search-clients"
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
                    <SelectItem value="nuevo">Nuevo</SelectItem>
                    <SelectItem value="presupuesto-enviado">Presupuesto Enviado</SelectItem>
                    <SelectItem value="presupuesto-pagado">Presupuesto Pagado</SelectItem>
                    <SelectItem value="en-tareas">En Tareas</SelectItem>
                    <SelectItem value="terminado">Terminado</SelectItem>
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
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Canal</label>
                <Select value={channelFilter} onValueChange={setChannelFilter}>
                  <SelectTrigger data-testid="select-filter-channel">
                    <SelectValue placeholder="Todos los canales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="telefono">Teléfono</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
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
            ) : filteredClients.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter || categoryFilter || channelFilter
                    ? "No se encontraron clientes con los filtros aplicados."
                    : "No hay clientes registrados aún."
                  }
                </p>
                <Button onClick={() => setShowNewClient(true)}>
                  Crear primer cliente
                </Button>
              </div>
            ) : (
              <div className="overflow-auto max-h-[60vh]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Última Act.</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedClients.map((client) => (
                      <TableRow key={client.id} data-testid={`client-row-${client.id}`}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mr-3">
                              <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-foreground">{client.name}</div>
                              {client.company && (
                                <div className="text-sm text-muted-foreground">{client.company}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-foreground">{client.email}</div>
                          <div className="text-sm text-muted-foreground">{client.phone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            className={statusColors[client.status as keyof typeof statusColors]}
                            data-testid={`client-status-badge-${client.id}`}
                          >
                            {statusLabels[client.status as keyof typeof statusLabels]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {client.category && (
                            <Badge variant="secondary" data-testid={`client-category-${client.id}`}>
                              {client.category.name}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {client.channel && (
                            <div className="flex items-center">
                              {channelIcons[client.channel as keyof typeof channelIcons]}
                              <span className="text-sm text-foreground ml-2">
                                {client.channel.charAt(0).toUpperCase() + client.channel.slice(1)}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatRelativeTime(client.updatedAt!)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setViewingClient(client)}
                              data-testid={`button-view-client-${client.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEditClient(client)}
                              data-testid={`button-edit-client-${client.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteClient(client.id, client.name)}
                              className="text-destructive hover:text-destructive"
                              data-testid={`button-delete-client-${client.id}`}
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
            {filteredClients.length > 0 && (
              <div className="bg-muted px-6 py-3 flex items-center justify-between border-t border-border">
                <div className="text-sm text-muted-foreground" data-testid="pagination-info">
                  Mostrando {startIndex + 1} a {Math.min(startIndex + ITEMS_PER_PAGE, filteredClients.length)} de {filteredClients.length} clientes
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

        <NewClientModal
          open={showNewClient || !!editingClient}
          onOpenChange={handleCloseModal}
          editingClient={editingClient}
        />

        <ViewClientModal
          open={!!viewingClient}
          onOpenChange={(open) => !open && setViewingClient(null)}
          client={viewingClient}
        />
      </div>
    </MainLayout>
  );
}
