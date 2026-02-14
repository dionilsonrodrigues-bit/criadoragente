import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  ShieldCheck, 
  LogOut,
  Users,
  Building2,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const isSuper = profile?.role === 'super_admin';

  const menuItems = isSuper ? [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: Building2, label: 'Empresas', path: '/admin/companies' },
    { icon: Package, label: 'Planos', path: '/admin/plans' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Bot, label: 'Meus Agentes', path: '/agents' },
    { icon: Users, label: 'Departamentos', path: '/departments' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate(isSuper ? '/super-login' : '/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bot className={isSuper ? "text-red-400" : "text-blue-400"} />
            AtendiPRO <span className={cn(
              "text-[10px] px-1.5 py-0.5 rounded uppercase font-black",
              isSuper ? "bg-red-600" : "bg-blue-600"
            )}>
              {isSuper ? 'MASTER' : 'IA'}
            </span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                location.pathname === item.path 
                  ? (isSuper ? "bg-red-600 text-white" : "bg-blue-600 text-white")
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-400">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase",
              isSuper ? "bg-red-600" : "bg-blue-600"
            )}>
              {user?.email?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.email?.split('@')[0]}
              </p>
              <p className="text-xs truncate text-slate-500">
                {isSuper ? 'Super Administrador' : 'Gestor de Empresa'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 mt-2 w-full text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Detalhes'}
          </h2>
          {profile?.company_id && (
             <div className="flex items-center gap-2 text-sm text-slate-500">
               <Building2 size={16} />
               Empresa vinculada
             </div>
          )}
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;