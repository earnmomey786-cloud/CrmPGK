import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { AuthLayout } from "@/components/layout/auth-layout";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Tasks from "@/pages/tasks";
import Pipeline from "@/pages/pipeline";
import Categories from "@/pages/categories";
import LoginPage from "@/pages/login";

function Router() {
  return (
    <AuthLayout>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/" component={Dashboard} />
        <Route path="/clients" component={Clients} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/pipeline" component={Pipeline} />
        <Route path="/categories" component={Categories} />
        {/* Fallback to 404 */}
        <Route component={NotFound} />
      </Switch>
    </AuthLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
