import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tags,
  Palette
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MainLayout from "@/components/layout/main-layout";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCategorySchema, type Category } from "@shared/schema";
import { z } from "zod";

const formSchema = insertCategorySchema.extend({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  color: z.string().min(1, "El color es requerido"),
});

const predefinedColors = [
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#84CC16", // Lime
  "#F97316", // Orange
  "#6B7280", // Gray
];

export default function Categories() {
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      color: predefinedColors[0],
    },
  });

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest("POST", "/api/categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada exitosamente.",
      });
      form.reset();
      setShowNewCategory(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la categoría. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; category: z.infer<typeof formSchema> }) => {
      const response = await apiRequest("PUT", `/api/categories/${data.id}`, data.category);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada exitosamente.",
      });
      form.reset();
      setEditingCategory(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría.",
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, category: data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      description: category.description || "",
      color: category.color,
    });
  };

  const handleDeleteCategory = (id: string, name: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${name}"?`)) {
      deleteCategoryMutation.mutate(id);
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setShowNewCategory(false);
      setEditingCategory(null);
      form.reset();
    }
  };

  return (
    <MainLayout title="Categorías">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Gestión de Categorías</h2>
            <p className="text-muted-foreground">Organiza y personaliza las categorías para tus clientes</p>
          </div>
          <Button 
            onClick={() => setShowNewCategory(true)}
            data-testid="button-new-category"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Categoría
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Tags className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                No hay categorías creadas aún.
              </p>
              <Button onClick={() => setShowNewCategory(true)}>
                Crear primera categoría
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow" data-testid={`category-card-${category.id}`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        <Tags 
                          className="h-6 w-6" 
                          style={{ color: category.color }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          ></div>
                          <span className="text-xs text-muted-foreground uppercase">
                            {category.color}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {category.createdAt ? 
                        new Date(category.createdAt).toLocaleDateString('es-ES') : 
                        'Reciente'
                      }
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        data-testid={`button-edit-category-${category.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="text-destructive hover:text-destructive"
                        data-testid={`button-delete-category-${category.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={showNewCategory || !!editingCategory} onOpenChange={handleModalClose}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoría" : "Nueva Categoría"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-category">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Autónomo, Impuestos, Informe" {...field} data-testid="input-category-name" />
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
                          placeholder="Descripción de la categoría..."
                          rows={3}
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-category-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-8 h-8 rounded-md border-2 border-border flex items-center justify-center"
                              style={{ backgroundColor: field.value }}
                            >
                              <Palette className="h-4 w-4 text-white" />
                            </div>
                            <Input
                              type="color"
                              {...field}
                              className="w-20 h-8 p-1 border-border"
                              data-testid="input-category-color"
                            />
                            <Input
                              type="text"
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="#3B82F6"
                              className="flex-1 font-mono text-sm"
                              data-testid="input-category-color-hex"
                            />
                          </div>
                          
                          <div className="grid grid-cols-5 gap-2">
                            {predefinedColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => field.onChange(color)}
                                className={`w-8 h-8 rounded-md border-2 transition-all hover:scale-110 ${
                                  field.value === color ? 'border-foreground' : 'border-transparent'
                                }`}
                                style={{ backgroundColor: color }}
                                data-testid={`color-preset-${color}`}
                              />
                            ))}
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-3 pt-6 border-t border-border">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => handleModalClose(false)}
                    data-testid="button-cancel-category"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                    data-testid="button-save-category"
                  >
                    {createCategoryMutation.isPending || updateCategoryMutation.isPending
                      ? "Guardando..." 
                      : editingCategory 
                        ? "Actualizar Categoría" 
                        : "Crear Categoría"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
