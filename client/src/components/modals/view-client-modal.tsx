import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Tag
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
          {client.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Notas:</span>
              </div>
              <div 
                className="ml-4 text-sm text-muted-foreground bg-muted p-2 rounded-md whitespace-pre-wrap"
                data-testid="client-notes"
              >
                {client.notes}
              </div>
            </div>
          )}

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