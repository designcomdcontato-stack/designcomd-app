import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  BarChart3 as BarChartIcon,
  Bell,
  CalendarPlus,
  ChevronRight,
  Circle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area
} from 'recharts';
import { Client, Post, CommemorativeDate, Task, TaskStatus, AgencySettings } from '../types';
import { cn, formatDate, parseSafeDate } from '../lib/utils';
import { PostLazyImage } from './PostLazyImage';
import { getUpcomingCommemorativeDate, getManyUpcomingDates, getDatesInRange } from '../lib/holidayUtils';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'motion/react';
import { supabaseService } from '../services/supabaseService';
import { getAutomaticCommemorativeDates } from '../lib/holidayUtils';

interface DashboardProps {
  client: Client;
  posts: Post[];
  tasks: Task[];
  commemorativeDates: CommemorativeDate[];
  onNavigate: (tab: string) => void;
  agencySettings: AgencySettings;
}

export function Dashboard({ client, posts: propsPosts, tasks: propsTasks, commemorativeDates: propsDates, onNavigate, agencySettings }: DashboardProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [commemorativeDates, setCommemorativeDates] = useState<CommemorativeDate[]>([]);
  const [followerHistory, setFollowerHistory] = useState<{ date: string; count: number }[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  useEffect(() => {
    if (!client?.id) {
      setPosts([]);
      setTasks([]);
      setFollowerHistory([]);
      setIsLoadingData(false);
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoadingData(true);
        // Limpar estados anteriores imediatamente ao trocar de cliente
        setPosts([]);
        setTasks([]);
        setFollowerHistory([]);
        
        console.log(`Dashboard: Fetching isolated data for client ${client.name} (${client.id})`);
        
        const [dbPosts, dbTasks, dbDates, dbDiary] = await Promise.all([
          supabaseService.getPosts(client.id),
          supabaseService.getTasks(client.id),
          supabaseService.getCommemorativeDates(client.id),
          supabaseService.getDiaryEntries(client.id)
        ]);

        setPosts(dbPosts || []);
        setTasks(dbTasks || []);
        setFollowerHistory(dbDiary || []);
        
        const currentYear = new Date().getFullYear();
        const automaticDates = getAutomaticCommemorativeDates(currentYear);
        setCommemorativeDates([...automaticDates, ...(dbDates || [])]);
      } catch (err) {
        console.error('Dashboard: Error fetching isolated data:', err);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDashboardData();
  }, [client?.id]);

  const upcomingWeeklyDates = getDatesInRange(
    commemorativeDates.filter(d => {
      // 1. Specific client context: if it belongs to this client, show it
      if (d.clientId && d.clientId === client?.id) {
        // Filter out manual dates already posted
        if (d.type === 'manual' && d.status === 'Postado') return false;
        return true;
      }
      
      // 2. Global context: if no clientId, only allow standard system dates
      if (!d.clientId && d.type === 'automatic') return true;
      
      // 3. Reject anything else (leaked manual data or other client's data)
      return false;
    }),
    7 // Next 7 days
  );

  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      start: firstDay.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };
  });

  const setPeriod = (days: number | 'month') => {
    const now = new Date();
    let start: Date;
    
    if (days === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      start = new Date();
      start.setDate(now.getDate() - days);
    }

    setDateRange({
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    });
  };

  if (!client?.id) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
        <Users className="text-slate-200 mb-4" size={48} />
        <h2 className="text-lg font-bold text-slate-900">Selecione um Cliente</h2>
        <p className="text-slate-500 text-sm mt-1">Dados não disponíveis para visualização.</p>
      </div>
    );
  }

  const clientPosts = posts.filter(p => 
    p.clientId === client.id && 
    p.date >= dateRange.start && 
    p.date <= dateRange.end
  );
  const totalPosts = clientPosts.length;
  const postedCount = clientPosts.filter(p => p.status === 'Postado').length;
  const pendingCount = clientPosts.filter(p => p.status !== 'Postado' && p.status !== 'Recusado').length;
  
  const totalReach = clientPosts.reduce((acc, p) => acc + (p.metrics?.reach || 0), 0);
  const totalEngagement = clientPosts.reduce((acc, p) => 
    acc + (p.metrics?.impressions || 0) + (p.metrics?.reach || 0) + (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0) + (p.metrics?.saves || 0) + (p.metrics?.plays || 0), 0
  );

  const latestFollowers = [...(followerHistory || [])].sort((a, b) => b.date.localeCompare(a.date))[0]?.count || 0;

  const clientPostsWithRate = clientPosts.map(p => {
    const interactions = (p.metrics?.impressions || 0) + (p.metrics?.reach || 0) + (p.metrics?.plays || 0) + (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0) + (p.metrics?.saves || 0);
    const rate = latestFollowers > 0 ? (interactions / latestFollowers) * 10 : 0;
    return { ...p, rate };
  });

  const totalEngagementRate = latestFollowers > 0 ? (totalEngagement / latestFollowers) * 10 : 0;

  const clientTasks = (tasks || []).filter(t => t.clientId === client.id);
  const pendingTasks = clientTasks.filter(t => t.status !== 'Feito').sort((a,b) => a.deliveryDate.localeCompare(b.deliveryDate));

  const getStatusProgress = (task: Task) => {
    if (task.status === 'Feito') return 100;

    if (task.checklist && (task.checklist || []).length > 0) {
      const completed = (task.checklist || []).filter(c => c.completed).length;
      const checklistProgress = (completed / (task.checklist || []).length) * 100;
      return Math.min(Math.round(checklistProgress), 95);
    }

    switch (task.status) {
      case 'Fazer': return 0;
      case 'Em andamento': return 25;
      case 'Pausado': return 25;
      case 'Aguardando': return 50;
      case 'Revisão': return 75;
      case 'Aprovação': return 90;
      default: return 0;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'Fazer': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Em andamento': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pausado': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Aguardando': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Revisão': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Aprovação': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Feito': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const stats = [
    { label: 'Total de Posts', value: totalPosts, icon: CalendarIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Taxa Engajamento', value: isLoadingData ? '...' : `${totalEngagementRate.toFixed(2).replace('.', ',')}%`, icon: TrendingUp, color: 'text-brand', bg: 'bg-brand/10' },
    { label: 'Postados', value: postedCount, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Seguidores', value: isLoadingData ? '...' : latestFollowers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const chartData = [...(followerHistory || [])]
    .filter(h => h.date >= dateRange.start && h.date <= dateRange.end)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(h => {
      const [year, month, day] = h.date.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return {
        name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        seguidores: h.count
      };
    });

  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const dailyEngagement = clientPostsWithRate.reduce((acc: Record<number, number>, p) => {
    const parts = p.date.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts.map(Number);
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      acc[dayOfWeek] = (acc[dayOfWeek] || 0) + p.rate;
    }
    return acc;
  }, {});

  const engagementData = days.map((name, i) => ({
    name,
    eng: dailyEngagement[i] || 0
  }));

  return (
    <div className="space-y-8">
      {upcomingWeeklyDates.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Próximas Datas na Semana (7 dias)
            </h3>
            <button 
              onClick={() => onNavigate('additional-dates')}
              className="text-[10px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest transition-colors flex items-center gap-1"
            >
              Ver Todas
              <ChevronRight size={12} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingWeeklyDates.map((item, idx) => {
              const isAutomatic = item.type === 'automatic';
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "p-5 rounded-[24px] border transition-all hover:shadow-md relative overflow-hidden group",
                    idx === 0 
                      ? (isAutomatic ? "bg-brand/5 border-brand/20" : "bg-emerald-50 border-emerald-200") 
                      : "bg-white border-slate-100"
                  )}
                >
                  {idx === 0 && (
                    <div className={cn(
                      "absolute top-0 left-0 w-1.5 h-full",
                      isAutomatic ? "bg-brand" : "bg-emerald-500"
                    )} />
                  )}
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider flex items-center gap-1",
                        idx === 0 
                          ? (isAutomatic ? "bg-brand/10 text-brand" : "bg-emerald-100 text-emerald-700") 
                          : "bg-slate-100 text-slate-500 shadow-sm"
                      )}>
                        {isAutomatic && <Star size={8} className="fill-current" />}
                        {isAutomatic ? 'Feriado / Data Comum' : item.category}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {(() => {
                          const dateObj = parseSafeDate(item.date);
                          return dateObj ? format(dateObj, "d 'de' MMM", { locale: ptBR }) : item.date;
                        })()}
                      </span>
                    </div>

                    <h4 className={cn(
                      "font-black tracking-tight line-clamp-1",
                      idx === 0 ? "text-lg text-slate-900" : "text-base text-slate-700"
                    )}>
                      {item.title}
                    </h4>

                    <div className="flex items-center justify-between pt-1">
                      {item.status ? (
                        <span className={cn(
                          "px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter inline-flex items-center gap-1 border shadow-sm",
                          idx === 0 ? "bg-white/80 border-emerald-100 text-emerald-800" : "bg-slate-50 border-slate-100 text-slate-500"
                        )}>
                          <Circle size={6} className="fill-current" />
                          {item.status}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 italic">
                          {isAutomatic ? 'Dica de Conteúdo' : 'Status não definido'}
                        </span>
                      )}
                      <button 
                        onClick={() => onNavigate(item.type === 'manual' ? 'additional-dates' : 'calendar')}
                        className="p-1.5 bg-white rounded-lg border border-slate-100 text-slate-400 hover:text-brand hover:border-brand/20 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <ArrowUpRight size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 text-sm">Visão geral de {client.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1 pr-3 border-r border-slate-100">
            <button 
              onClick={() => setPeriod(7)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
            >
              7 Dias
            </button>
            <button 
              onClick={() => setPeriod(30)}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
            >
              30 Dias
            </button>
            <button 
              onClick={() => setPeriod('month')}
              className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
            >
              Este Mês
            </button>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
            <CalendarIcon size={14} className="text-slate-400" />
            <input 
              type="date" 
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>
          <ChevronRight size={14} className="text-slate-300" />
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
            <CalendarIcon size={14} className="text-slate-400" />
            <input 
              type="date" 
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                <stat.icon className={stat.color} size={20} />
              </div>
              <span className="flex items-center text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <ArrowUpRight size={12} className="mr-1" />
                12%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Crescimento de Seguidores</h3>
            <TrendingUp size={18} className="text-slate-400" />
          </div>
          <div className="min-h-[300px] h-[300px] w-full" style={{ minWidth: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={agencySettings.primaryColor} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={agencySettings.primaryColor} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="seguidores" stroke={agencySettings.primaryColor} strokeWidth={3} fillOpacity={1} fill="url(#colorSeg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-900">Engajamento Diário</h3>
            <BarChartIcon size={18} className="text-slate-400" />
          </div>
          <div className="min-h-[300px] h-[300px] w-full" style={{ minWidth: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="eng" fill={agencySettings.primaryColor} radius={[4, 4, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Posts Recentes</h3>
            <button 
              onClick={() => onNavigate('feed')}
              className="text-sm font-semibold text-brand hover:opacity-80 transition-all"
            >
              Ver todos
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3">Conteúdo</th>
                  <th className="px-6 py-3">Data</th>
                  <th className="px-6 py-3">Engajamento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientPostsWithRate.slice(0, 4).map((post) => {
                  return (
                    <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
                            <PostLazyImage
                              postId={post.id}
                              className="w-full h-full object-cover"
                              fallback={<div className="w-full h-full bg-slate-100" />}
                            />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">{post.title}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{post.format}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[11px] text-slate-600 font-medium">{formatDate(post.date)}</td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-900">{post.rate > 0 ? `${post.rate.toFixed(2).replace('.', ',')}%` : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Próximas Tarefas</h3>
            <button 
              onClick={() => onNavigate('tasks')}
              className="text-sm font-semibold text-brand hover:opacity-80 transition-all"
            >
              Gerenciar
            </button>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-3">Tarefa / Projeto</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Progresso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingTasks.slice(0, 4).map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 truncate max-w-[150px]">{task.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Resp: {task.responsible}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase border",
                        getStatusColor(task.status)
                      )}>
                        {task.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 min-w-[100px]">
                      <div className="space-y-1">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand transition-all duration-500"
                            style={{ width: `${getStatusProgress(task)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400">{getStatusProgress(task)}%</span>
                          {task.checklist && (task.checklist || []).length > 0 && (
                            <span className="text-[9px] text-slate-300">
                              {(task.checklist || []).filter(c => c.completed).length}/{(task.checklist || []).length}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
