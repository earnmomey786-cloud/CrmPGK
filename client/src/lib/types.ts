export interface DashboardStats {
  totalClients: number;
  pendingTasks: number;
  pipelineStats: {
    nuevo: number;
    "presupuesto-enviado": number;
    "presupuesto-pagado": number;
    "en-tareas": number;
    "terminado": number;
  };
}
