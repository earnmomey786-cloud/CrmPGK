import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, User } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import type { ClientWithCategory } from "@shared/schema";
import { Link } from "wouter";

const pipelineStages = [
  { key: "nuevo", label: "Nuevo", color: "bg-chart-1", textColor: "text-chart-1" },
  { key: "presupuesto-enviado", label: "Presupuesto Enviado", color: "bg-chart-2", textColor: "text-chart-2" },
  { key: "presupuesto-pagado", label: "Presupuesto Pagado", color: "bg-chart-3", textColor: "text-chart-3" },
  { key: "en-tareas", label: "En Tareas", color: "bg-chart-4", textColor: "text-chart-4" },
  { key: "terminado", label: "Terminado", color: "bg-chart-5", textColor: "text-chart-5" },
];

export default function Pipeline() {
  const { data: allClients = [], isLoading } = useQuery<ClientWithCategory[]>({
    queryKey: ["/api/clients"],
  });

  const clientsByStage = pipelineStages.reduce((acc, stage) => {
    acc[stage.key] = allClients.filter(client => client.status === stage.key);
    return acc;
  }, {} as Record<string, ClientWithCategory[]>);


  if (isLoading) {
    return (
      <MainLayout title="Pipeline de Ventas">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-3">
                  <div className="h-6 bg-muted rounded animate-pulse"></div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-16 bg-muted rounded animate-pulse"></div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Pipeline de Ventas">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Pipeline de Ventas</h2>
          <Link href="/clients">
            <Button variant="outline" data-testid="button-view-all-clients-pipeline">
              Ver todos los clientes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {allClients.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">
                No hay clientes en el pipeline aún.
              </p>
              <Link href="/clients">
                <Button>Ver gestión de clientes</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Pipeline Stats Summary */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              {pipelineStages.map((stage) => {
                const clients = clientsByStage[stage.key] || [];
                return (
                  <Card key={stage.key} data-testid={`pipeline-stage-${stage.key}`}>
                    <CardContent className="p-4 text-center">
                      <div className={`text-2xl font-bold ${stage.textColor} mb-1`}>
                        {clients.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stage.label}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Detailed Pipeline Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 overflow-x-auto">
              {pipelineStages.map((stage) => {
                const clients = clientsByStage[stage.key] || [];
                return (
                  <Card key={stage.key} className="min-h-[400px]" data-testid={`pipeline-column-${stage.key}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{stage.label}</span>
                        <Badge variant="secondary" className={`${stage.color}/20 ${stage.textColor}`}>
                          {clients.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {clients.length === 0 ? (
                        <div className="text-center py-8">
                          <div className={`w-12 h-12 ${stage.color}/20 rounded-full flex items-center justify-center mx-auto mb-3`}>
                            <User className={`h-6 w-6 ${stage.textColor}`} />
                          </div>
                          <p className="text-muted-foreground text-sm">
                            No hay clientes en esta etapa
                          </p>
                        </div>
                      ) : (
                        clients.map((client) => (
                          <Card 
                            key={client.id} 
                            className="border-l-4 hover:shadow-md transition-shadow cursor-pointer"
                            style={{ borderLeftColor: `hsl(var(--chart-${pipelineStages.findIndex(s => s.key === stage.key) + 1}))` }}
                            data-testid={`pipeline-client-${client.id}`}
                          >
                            <CardContent className="p-2">
                              <div className="space-y-1">
                                <h4 className="font-medium text-sm text-foreground truncate">
                                  {client.name}
                                </h4>
                                {client.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {client.category.name}
                                  </Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
