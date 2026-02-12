import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AgentWizard from "./pages/AgentWizard";
import Departments from "./pages/Departments";
import AdminDashboard from "./pages/AdminDashboard";
import Login from "./pages/Login";
import SuperLogin from "./pages/SuperLogin";
import Layout from "./components/Layout";
import { Button } from "./components/ui/button";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: 'super_admin' | 'company_admin' }) => {
  const { session, profile, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Verificando acesso...</p>
      </div>
    );
  }

  // Se não houver sessão, vai para o login adequado
  if (!session) {
    return <Navigate to={role === 'super_admin' ? "/super-login" : "/login"} replace />;
  }

  // Se houver sessão mas não houver perfil carregado (erro de banco)
  if (!profile) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
          <h2 className="text-xl font-bold text-red-600">Erro de Perfil</h2>
          <p className="text-slate-500 mt-2">Seu usuário existe, mas os dados de permissão não foram encontrados.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => window.location.reload()} variant="default" className="w-full">
              Recarregar Página
            </Button>
            <Button onClick={() => signOut()} variant="outline" className="w-full">
              Sair e Tentar Outro Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Lógica de redirecionamento por cargo
  if (role && profile.role !== role) {
    // Se o super admin tentar entrar na rota de empresa, manda pro /admin
    if (profile.role === 'super_admin' && location.pathname !== '/admin') {
      return <Navigate to="/admin" replace />;
    }
    // Se o gestor tentar entrar no /admin, manda pra home
    if (profile.role === 'company_admin' && location.pathname === '/admin') {
      return <Navigate to="/" replace />;
    }
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
            <Route path="/login" element={<Login />} />
            <Route path="/super-login" element={<SuperLogin />} />

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