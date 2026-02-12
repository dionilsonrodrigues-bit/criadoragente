import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AgentWizard from "./pages/AgentWizard";
import Departments from "./pages/Departments";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import SuperLogin from "./pages/SuperLogin";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: 'super_admin' | 'company_admin' }) => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center text-slate-500">Autenticando...</div>;
  }

  if (!session) {
    return <Navigate to={role === 'super_admin' ? "/super-login" : "/login"} replace />;
  }

  if (role && profile?.role !== role) {
    return <Navigate to={profile?.role === 'super_admin' ? "/admin" : "/"} replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter>
          <Routes>
            {/* Logins Separados */}
            <Route path="/login" element={<Login />} />
            <Route path="/super-login" element={<SuperLogin />} />

            {/* Rotas de Admin de Empresa */}
            <Route element={
              <ProtectedRoute role="company_admin">
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<Index />} />
              <Route path="/agents/new" element={<AgentWizard />} />
              <Route path="/agents/edit/:id" element={<AgentWizard />} />
              <Route path="/departments" element={<Departments />} />
            </Route>

            {/* Rotas de Super Admin */}
            <Route element={
              <ProtectedRoute role="super_admin">
                <Layout />
              </ProtectedRoute>
            }>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;