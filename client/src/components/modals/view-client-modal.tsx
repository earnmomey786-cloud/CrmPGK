import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Users, 
  Mail, 
  Phone, 
  MessageSquare, 
  Clock, 
  FileText,
  Tag,
  Edit3,
  Save,
  X
} from "lucide-react";
import { format } from "date-fns";
import type { ClientWithCategory } from "@shared/schema";

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

const channelLabels = {
  whatsapp: "WhatsApp",
  email: "Email",
  telefono: "Teléfono",
  presencial: "Presencial",
};

const channelIcons = {
  whatsapp: <MessageSquare className="h-4 w-4 text-chart-2" />,
  email: <Mail className="h-4 w-4 text-chart-3" />,
  telefono: <Phone className="h-4 w-4 text-chart-4" />,
  presencial: <User className="h-4 w-4 text-muted-foreground" />,
};

interface ViewClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: ClientWithCategory | null;
}

export default function ViewClientModal({ open, onOpenChange, client }: ViewClientModalProps) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Initialize notes text when client changes
  useEffect(() => {
    setNotesText(client?.notes || "");
    setEditingNotes(false);
  }, [client]);

  const updateNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      const response = await apiRequest("PUT", `/api/clients/${client!.id}`, {
        notes: notes || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Notas actualizadas",
        description: "Las notas del cliente han sido actualizadas exitosamente.",
      });
      setEditingNotes(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron actualizar las notas. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSaveNotes = () => {
    updateNotesMutation.mutate(notesText);
  };

  const handleCancelEdit = () => {
    setNotesText(client?.notes || "");
    setEditingNotes(false);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg flex items-center gap-2" data-testid="modal-client-title">
            <User className="h-5 w-5 text-primary" />
            {client.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status and Category */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Estado:</span>
              <Badge 
                className={statusColors[client.status as keyof typeof statusColors]}
                data-testid="client-status-badge"
              >
                {statusLabels[client.status as keyof typeof statusLabels]}
              </Badge>
            </div>
            
            {client.category && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Categoría:</span>
                <Badge 
                  style={{ 
                    backgroundColor: `${client.category.color}20`,
                    color: client.category.color 
                  }}
                  data-testid="client-category-badge"
                >
                  {client.category.name}
                </Badge>
              </div>
            )}
          </div>

          <Separator />

          {/* Company Information */}
          {client.company && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Empresa:</span>
                <span className="text-sm font-medium" data-testid="client-company">
                  {client.company}
                </span>
              </div>
            </div>
          )}

          {/* NIE Information */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">NIE/Documento:</span>
              <span className="text-sm" data-testid="client-nie">
                {client.nie || "No especificado"}
              </span>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              Contacto
            </h4>
            
            <div className="ml-4 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Email:</span>
                <a 
                  href={`mailto:${client.email}`}
                  className="text-sm text-primary hover:underline"
                  data-testid="client-email"
                >
                  {client.email}
                </a>
              </div>
              
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Teléfono:</span>
                <a 
                  href={`tel:${client.phone}`}
                  className="text-sm text-primary hover:underline"
                  data-testid="client-phone"
                >
                  {client.phone}
                </a>
              </div>
              
              {client.whatsapp && (
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">WhatsApp:</span>
                  <a 
                    href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                    data-testid="client-whatsapp"
                  >
                    {client.whatsapp}
                  </a>
                </div>
              )}
              
              {client.channel && (
                <div className="flex items-center gap-2">
                  {channelIcons[client.channel as keyof typeof channelIcons]}
                  <span className="text-sm font-medium">Canal preferido:</span>
                  <span className="text-sm" data-testid="client-channel">
                    {channelLabels[client.channel as keyof typeof channelLabels] || client.channel}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Notas:</span>
              </div>
              {!editingNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingNotes(true)}
                  data-testid="button-edit-notes"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            {editingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Escribe notas sobre este cliente..."
                  rows={4}
                  className="resize-none"
                  data-testid="textarea-client-notes"
                />
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={updateNotesMutation.isPending}
                    data-testid="button-cancel-notes"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancelar
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={updateNotesMutation.isPending}
                    data-testid="button-save-notes"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {updateNotesMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="ml-4 text-sm text-muted-foreground bg-muted p-3 rounded-md whitespace-pre-wrap min-h-[60px]"
                data-testid="client-notes-display"
              >
                {client.notes || "Sin notas registradas. Haz clic en el ícono de editar para agregar notas."}
              </div>
            )}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-1 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Creado: {format(new Date(client.createdAt!), "dd/MM/yyyy")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Actualizado: {format(new Date(client.updatedAt!), "dd/MM/yyyy")}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}