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
import { Button } from "./components/ui/button";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, role }: { children: React.ReactNode, role?: 'super_admin' | 'company_admin' }) => {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Verificando acesso...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to={role === 'super_admin' ? "/super-login" : "/login"} replace />;
  }

  if (!profile && session) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-sm w-full">
          <h2 className="text-xl font-bold text-red-600">Acesso Restrito</h2>
          <p className="text-slate-500 mt-2">Seu perfil (profiles) não foi encontrado na base de dados.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button onClick={() => window.location.reload()} variant="default" className="w-full">
              Tentar Novamente
            </Button>
            <Button onClick={() => signOut()} variant="outline" className="w-full">
              Sair da Conta
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (role && profile?.role !== role) {
    const destination = profile?.role === 'super_admin' ? "/admin" : "/";
    return <Navigate to={destination} replace />;
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