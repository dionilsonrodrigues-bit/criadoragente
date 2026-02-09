import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Bot, 
  Building2, 
  Settings, 
  ShieldCheck, 
  LogOut,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

const Layout = () => {
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Bot, label: 'Meus Agentes', path: '/agents/new' },
    { icon: Users, label: 'Departamentos', path: '/departments' },
    { icon: ShieldCheck, label: 'Super Admin', path: '/admin' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bot className="text-blue-400" />
            AtendiPRO <span className="text-xs bg-blue-600 px-1.5 py-0.5 rounded uppercase">IA</span>
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
                  ? "bg-blue-600 text-white" 
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
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
              EM
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">Empresa Demo</p>
              <p className="text-xs truncate">Plano Pro</p>
            </div>
          </div>
          <button className="flex items-center gap-3 px-3 py-2 mt-2 w-full text-slate-400 hover:text-white transition-colors">
            <LogOut size={18} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Detalhes'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full border">
              Empresa ID: #12345
            </span>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;