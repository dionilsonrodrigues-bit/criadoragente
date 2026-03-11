import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  LogOut,
  Users,
  Building2,
  ShieldCheck,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';

const Layout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();

  const isSuperAdmin = profile?.role === 'super_admin';

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Bot, label: 'Meus Agentes', path: '/agents' },
    { icon: Users, label: 'Departamentos', path: '/departments' },
  ];

  const adminItems = [
    { icon: Building2, label: 'Empresas', path: '/admin/companies' },
    { icon: UserCog, label: 'Usuários', path: '/admin/users' },
  ];

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-left">
      <aside className="w-64 bg-slate-950 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800/50">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bot className="text-blue-500" />
            AtendiPRO <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-black bg-blue-600">
              IA
            </span>
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Principal</p>
            <div className="space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                    location.pathname === item.path 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  )}
                >
                  <item.icon size={18} />
                  <span className="font-medium text-sm">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {isSuperAdmin && (
            <div>
              <p className="px-3 text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <ShieldCheck size={10} /> Administração
              </p>
              <div className="space-y-1">
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200",
                      location.pathname === item.path 
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white"
                    )}
                  >
                    <item.icon size={18} />
                    <span className="font-medium text-sm">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-900">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-400">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase shrink-0",
              isSuperAdmin ? "bg-amber-500" : "bg-blue-600"
            )}>
              {user?.email?.charAt(0) ?? 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.email?.split('@')[0]}
              </p>
              <p className={cn(
                "text-[10px] truncate uppercase font-bold",
                isSuperAdmin ? "text-amber-500" : "text-slate-500"
              )}>
                {isSuperAdmin ? 'Super Administrador' : 'Admin da Empresa'}
              </p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 mt-2 w-full text-slate-500 hover:text-red-400 hover:bg-red-950/20 rounded-md transition-colors"
          >
            <LogOut size={16} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto relative bg-slate-50/50">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-widest">
            {menuItems.find(item => item.path === location.pathname)?.label || 
             adminItems.find(item => item.path === location.pathname)?.label || 'Detalhes'}
          </h2>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;