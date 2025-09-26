import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertTaskSchema, type ClientWithCategory, type TaskWithClient } from "@shared/schema";
import { z } from "zod";
import { cn } from "@/lib/utils";

const formSchema = insertTaskSchema.extend({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
});

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClientId?: string;
  editingTask?: TaskWithClient | null;
}

export default function NewTaskModal({ open, onOpenChange, selectedClientId, editingTask }: NewTaskModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: editingTask?.title || "",
      description: editingTask?.description || "",
      clientId: editingTask?.clientId || selectedClientId || "",
      priority: editingTask?.priority || "media",
      status: editingTask?.status || "pendiente",
      dueDate: editingTask?.dueDate ? new Date(editingTask.dueDate) : undefined,
    },
  });

  // Reset form when editingTask changes
  useEffect(() => {
    if (editingTask) {
      form.reset({
        title: editingTask.title,
        description: editingTask.description || "",
        clientId: editingTask.clientId || "",
        priority: editingTask.priority,
        status: editingTask.status,
        dueDate: editingTask.dueDate ? new Date(editingTask.dueDate) : undefined,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        clientId: selectedClientId || "",
        priority: "media",
        status: "pendiente",
        dueDate: undefined,
      });
    }
  }, [editingTask, selectedClientId, form]);

  const { data: clients = [] } = useQuery<ClientWithCategory[]>({
    queryKey: ["/api/clients"],
  });

  const saveTaskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (editingTask) {
        const response = await apiRequest("PUT", `/api/tasks/${editingTask.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/tasks", data);
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: editingTask ? "Tarea actualizada" : "Tarea creada",
        description: editingTask 
          ? "La tarea ha sido actualizada exitosamente."
          : "La tarea ha sido creada exitosamente.",
      });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      console.error("Error saving task:", error);
      toast({
        title: "Error",
        description: editingTask 
          ? "No se pudo actualizar la tarea. Intenta de nuevo."
          : "No se pudo crear la tarea. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    // Convert empty string to null for clientId and description
    // Convert dueDate to proper Date object or null
    const cleanedData = {
      ...data,
      clientId: data.clientId === "" ? null : data.clientId,
      description: data.description === "" ? null : data.description,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
    };
    console.log("Sending task data:", cleanedData);
    saveTaskMutation.mutate(cleanedData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingTask ? "Editar Tarea" : "Nueva Tarea"}</DialogTitle>
          <DialogDescription>
            {editingTask 
              ? "Modifica los detalles de la tarea existente."
              : "Crea una nueva tarea para gestionar el trabajo de tu equipo."
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-new-task">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Enviar presupuesto" {...field} data-testid="input-task-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalles de la tarea..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-task-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <FormControl>
                        <SelectTrigger data-testid="select-task-client">
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-task-priority">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="baja">Baja</SelectItem>
                        <SelectItem value="media">Media</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-task-status">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="en-progreso">En Progreso</SelectItem>
                        <SelectItem value="completada">Completada</SelectItem>
                        <SelectItem value="cancelada">Cancelada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha de vencimiento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            data-testid="button-task-due-date"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-border">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-task"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saveTaskMutation.isPending}
                data-testid="button-save-task"
              >
                {saveTaskMutation.isPending 
                  ? "Guardando..."
                  : editingTask ? "Actualizar Tarea" : "Guardar Tarea"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
