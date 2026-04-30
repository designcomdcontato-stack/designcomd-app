import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Grid, 
  BarChart3 as BarChartIcon, 
  FileText, 
  FolderOpen, 
  UserCircle, 
  Settings,
  ChevronRight,
  Plus,
  LogOut,
  Menu,
  X,
  Target,
  History,
  Upload,
  ListTodo,
  CalendarPlus,
  Lock,
  Wallet
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Client, AgencySettings } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  onLogout: () => void;
  agencySettings: AgencySettings;
  isAdmin?: boolean;
}

export function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen, 
  isCollapsed, 
  setIsCollapsed, 
  onLogout, 
  agencySettings,
  isAdmin = false 
}: SidebarProps) {
  const sidebarItems = [
    { id: 'profiles', label: 'Perfis', icon: Users },
    { id: 'planning', label: 'Planejamento', icon: FileText },
    { id: 'tasks', label: 'Tarefas', icon: ListTodo },
    { id: 'editorial', label: 'Linha Editorial', icon: Target },
    { id: 'diary', label: 'Diário', icon: History },
    { id: 'finance', label: 'Financeiro', icon: Wallet },
    { id: 'import', label: 'Importar', icon: Upload, adminOnly: true },
    { id: 'files', label: 'Arquivos', icon: FolderOpen },
    { id: 'team', label: 'Equipe', icon: UserCircle, adminOnly: true },
    { id: 'settings', label: 'Configurações', icon: Settings, adminOnly: true },
  ];

  const visibleItems = sidebarItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transition-all duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-20" : "w-64"
      )}>
        <div className="flex flex-col h-full">
          <div className={cn(
            "p-6 border-b border-slate-100 flex items-center justify-between",
            isCollapsed && "p-4 justify-center"
          )}>
            <div className="flex items-center gap-2 overflow-hidden">
              {agencySettings.logo ? (
                <img src={agencySettings.logo} alt={agencySettings.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                  {agencySettings.name.charAt(0)}
                </div>
              )}
              {!isCollapsed && (
                <span className="font-bold text-xl tracking-tight text-slate-900 truncate max-w-[140px] animate-in fade-in duration-300">
                  {agencySettings.name}
                </span>
              )}
            </div>
            
            {!isCollapsed && (
              <button 
                onClick={() => setIsOpen(false)} 
                className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-4 space-y-2">
            {visibleItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  "w-full flex items-center rounded-lg text-sm font-medium transition-all group",
                  isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2",
                  activeTab === item.id 
                    ? "bg-brand/10 text-brand" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <item.icon size={20} className={activeTab === item.id ? "text-brand" : "text-slate-400 group-hover:text-slate-600"} />
                {!isCollapsed && (
                  <span className="truncate animate-in fade-in slide-in-from-left-2 duration-300">
                    {item.label}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-100 space-y-2">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                "hidden lg:flex w-full items-center rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all",
                isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
              )}
            >
              <ChevronRight size={18} className={cn("transition-transform duration-300 text-slate-400", isCollapsed ? "rotate-0" : "rotate-180")} />
              {!isCollapsed && <span>Recolher menu</span>}
            </button>

            <button 
              onClick={onLogout}
              title={isCollapsed ? "Sair" : undefined}
              className={cn(
                "w-full flex items-center rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all",
                isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
              )}
            >
              <LogOut size={18} className="text-slate-400 group-hover:text-red-500" />
              {!isCollapsed && <span>Sair</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

interface HeaderProps {
  clients: Client[];
  activeClient: Client | null;
  agencySettings: AgencySettings;
  setActiveClient: (client: Client) => void;
  toggleSidebar: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Header({ 
  clients, 
  activeClient, 
  agencySettings,
  setActiveClient, 
  toggleSidebar, 
  activeTab, 
  setActiveTab,
}: HeaderProps) {
  const headerItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'additional-dates', label: 'Datas Adicionais', icon: CalendarPlus },
    { id: 'calendar', label: 'Calendário', icon: Calendar },
    { id: 'feed', label: 'Feed', icon: Grid },
    { id: 'metrics', label: 'Métricas', icon: BarChartIcon },
  ];

  const preferredClientId = agencySettings.preferredClientId;

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 flex items-center justify-between">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar focus-visible:outline-none">
        <div className="flex items-center gap-4 border-r border-slate-100 pr-4 mr-0">
          <button 
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md"
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex items-center gap-1">
          {headerItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                activeTab === item.id 
                  ? "bg-brand/10 text-brand" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={16} className={activeTab === item.id ? "text-brand" : "text-slate-400"} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="hidden lg:flex items-center gap-3">
        {/* Placeholder for user profile or extra header content if needed */}
      </div>
    </header>
  );
}
