import React, { useState } from 'react';
import { Post, Client, CommemorativeDate, Task } from '../types';
import { cn, generateTempId } from '../lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus,
  Calendar as CalendarIcon,
  LayoutGrid,
  Columns,
  Star,
  Gift,
  X,
  CheckCircle2,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addWeeks, 
  subWeeks,
  isToday
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarViewProps {
  client: Client;
  posts: Post[];
  tasks: Task[];
  commemorativeDates: CommemorativeDate[];
  onEditPost: (post: Post) => void;
  onAddPost: (post: Post) => void;
  onAddCommemorativeDate: (date: CommemorativeDate) => void;
}

export function CalendarView({ 
  client, 
  posts, 
  tasks,
  commemorativeDates, 
  onEditPost, 
  onAddPost, 
  onAddCommemorativeDate 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [isAddingDate, setIsAddingDate] = useState(false);
  const [newDateForm, setNewDateForm] = useState({ title: '', date: format(new Date(), 'yyyy-MM-dd') });

  const clientPosts = posts.filter(p => p.clientId === client.id);
  const clientTasks = (tasks || []).filter(t => t.clientId === client.id);

  const handleCreatePostFromHoliday = (holiday: CommemorativeDate) => {
    const newPost: Post = {
      id: generateTempId(),
      clientId: client.id,
      title: holiday.title,
      date: holiday.date,
      status: 'Ideia',
      channels: [(client.socialMedia || [])[0] || 'Instagram'],
      format: 'Estático',
      editorialItemId: (client.editorialLine || [])[0]?.id || '1',
      description: `Post sugerido para: ${holiday.title}`,
      responsible: 'Equipe',
      checklist: [],
      comments: [],
      metrics: { reach: 0, plays: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    };
    onAddPost(newPost);
    onEditPost(newPost);
  };

  const handleAddManualDate = () => {
    if (!newDateForm.title || !newDateForm.date) return;
    onAddCommemorativeDate({
      id: generateTempId(), // Supabase will generate UUID, but we need unique key for UI
      title: newDateForm.title,
      date: newDateForm.date,
      type: 'manual',
      category: 'Data comemorativa',
      status: 'Ideia'
    });
    setIsAddingDate(false);
    setNewDateForm({ title: '', date: format(new Date(), 'yyyy-MM-dd') });
  };

  const handleCreateEmptyPost = (date: string) => {
    const newPost: Post = {
      id: generateTempId(),
      clientId: client.id,
      title: '',
      date: date,
      status: 'Ideia',
      channels: [(client.socialMedia || [])[0] || 'Instagram'],
      format: 'Estático',
      editorialItemId: (client.editorialLine || [])[0]?.id || '',
      description: '',
      responsible: 'Equipe',
      checklist: [],
      comments: [],
      metrics: { reach: 0, plays: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    };
    onAddPost(newPost);
    onEditPost(newPost);
  };

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="px-4 py-3 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px]">
          {calendarDays.map((day, i) => {
            const isCurrentMonth = isSameMonth(day, monthStart);
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayPosts = clientPosts.filter(p => p.date === dateStr);
            const dayTasks = clientTasks.filter(t => t.deliveryDate === dateStr);
            const dayHolidays = commemorativeDates.filter(d => 
              d.date === dateStr && (
                d.clientId === client.id || 
                (!d.clientId && d.type === 'automatic')
              )
            );
            
            return (
              <div 
                key={i} 
                className={cn(
                  "border-r border-b border-slate-100 p-2 group hover:bg-slate-50/50 transition-colors",
                  !isCurrentMonth && "bg-slate-50/30"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full",
                    isToday(day) ? "bg-brand text-white" : isCurrentMonth ? "text-slate-700" : "text-slate-300"
                  )}>
                    {format(day, 'd')}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                    <button 
                      onClick={() => {
                        setNewDateForm({ ...newDateForm, date: dateStr });
                        setIsAddingDate(true);
                      }}
                      className="p-1 text-slate-400 hover:text-brand"
                      title="Adicionar Evento"
                    >
                      <Star size={14} />
                    </button>
                    <button 
                      onClick={() => handleCreateEmptyPost(dateStr)}
                      className="p-1 text-slate-400 hover:text-brand transition-colors" 
                      title="Novo Post"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                  {dayHolidays.map(holiday => {
                    const isManual = holiday.type === 'manual';
                    const categoryColors = {
                      'Data comemorativa': 'bg-amber-50 text-amber-700 border-amber-100',
                      'Aniversário': 'bg-emerald-50 text-emerald-700 border-emerald-100',
                      'Tempo de Empresa': 'bg-blue-50 text-blue-700 border-blue-100',
                      'Aniversariante do mês': 'bg-purple-50 text-purple-700 border-purple-100',
                      'Reunião de ciclo': 'bg-rose-50 text-rose-700 border-rose-100'
                    };
                    const colorClass = isManual ? categoryColors[holiday.category] : 'bg-amber-50 text-amber-700 border-amber-100';

                    return (
                      <div 
                        key={holiday.id}
                        className={cn(
                          "flex items-center justify-between group/holiday px-2 py-1 rounded-md text-[9px] font-bold border",
                          colorClass
                        )}
                        title={`${holiday.title} (${holiday.category})`}
                      >
                        <span className="truncate flex items-center gap-1">
                          {isManual ? <Bell size={10} className="text-current" /> : <Star size={10} className="fill-amber-400 text-amber-400" />}
                          {holiday.title}
                        </span>
                        <button 
                          onClick={() => handleCreatePostFromHoliday(holiday)}
                          className="opacity-0 group-hover/holiday:opacity-100 hover:text-brand transition-all"
                          title="Transformar em Post"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    );
                  })}
                  {dayTasks.map(task => (
                    <div 
                      key={task.id}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded-md text-[9px] font-bold truncate border flex items-center gap-1",
                        task.status === 'Feito' ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-blue-50 text-blue-700 border-blue-100"
                      )}
                      title={`Tarefa: ${task.title}`}
                    >
                      <CheckCircle2 size={8} />
                      {task.title}
                    </div>
                  ))}
                  {dayPosts.map(post => (
                    <button 
                      key={post.id}
                      onClick={() => onEditPost(post)}
                      className={cn(
                        "w-full text-left px-2 py-1 rounded-md text-[9px] font-bold truncate border",
                        post.status === 'Postado' ? "bg-green-50 text-green-700 border-green-100" : "bg-brand/5 text-brand border-brand/10"
                      )}
                    >
                      {post.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    const weekDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {weekDays.map((day, i) => (
            <div key={i} className="px-4 py-4 text-center border-r border-slate-100 last:border-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                {format(day, 'eee', { locale: ptBR })}
              </p>
              <div className={cn(
                "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold relative group/day",
                isToday(day) ? "bg-brand text-white" : "text-slate-700"
              )}>
                {format(day, 'd')}
                <button 
                  onClick={() => handleCreateEmptyPost(format(day, 'yyyy-MM-dd'))}
                  className="absolute -right-6 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-brand opacity-0 group-hover/day:opacity-100 transition-all"
                  title="Novo Post"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 min-h-[500px]">
          {weekDays.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayPosts = clientPosts.filter(p => p.date === dateStr);
            const dayTasks = clientTasks.filter(t => t.deliveryDate === dateStr);
            const dayHolidays = commemorativeDates.filter(d => 
              d.date === dateStr && (
                d.clientId === client.id || 
                (!d.clientId && d.type === 'automatic')
              )
            );
            
            return (
              <div key={i} className="border-r border-slate-100 last:border-0 p-4 bg-slate-50/20">
                <div className="space-y-3">
                  {dayHolidays.map(holiday => {
                    const isManual = holiday.type === 'manual';
                    const categoryColors = {
                      'Data comemorativa': 'bg-amber-50 border-amber-100 text-amber-900',
                      'Aniversário': 'bg-emerald-50 border-emerald-100 text-emerald-900',
                      'Tempo de Empresa': 'bg-blue-50 border-blue-100 text-blue-900',
                      'Aniversariante do mês': 'bg-purple-50 border-purple-100 text-purple-900',
                      'Reunião de ciclo': 'bg-rose-50 border-rose-100 text-rose-900'
                    };
                    const labelColors = {
                      'Data comemorativa': 'text-amber-800',
                      'Aniversário': 'text-emerald-800',
                      'Tempo de Empresa': 'text-blue-800',
                      'Aniversariante do mês': 'text-purple-800',
                      'Reunião de ciclo': 'text-rose-800'
                    };
                    const colorClass = isManual ? categoryColors[holiday.category] : 'bg-amber-50 border-amber-100 text-amber-900';
                    const labelClass = isManual ? labelColors[holiday.category] : 'text-amber-800';

                    return (
                      <div 
                        key={holiday.id}
                        className={cn("p-3 rounded-xl relative group/holiday border", colorClass)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {isManual ? <Bell size={14} className="text-current" /> : <Star size={14} className="fill-amber-400 text-amber-400" />}
                            <span className={cn("text-[10px] font-bold uppercase tracking-wider", labelClass)}>
                              {isManual ? holiday.category : 'Data Comemorativa'}
                            </span>
                          </div>
                          <button 
                            onClick={() => handleCreatePostFromHoliday(holiday)}
                            className="p-1 hover:text-brand bg-white rounded-lg shadow-sm border border-slate-100 opacity-0 group-hover/holiday:opacity-100 transition-all"
                            title="Transformar em Post"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <p className="text-xs font-bold">{holiday.title}</p>
                        {holiday.description && (
                          <p className="text-[10px] opacity-60 mt-1 line-clamp-2">{holiday.description}</p>
                        )}
                      </div>
                    );
                  })}

                  {dayTasks.map(task => (
                    <div 
                      key={task.id}
                      className={cn(
                        "p-3 rounded-xl border relative group/task",
                        task.status === 'Feito' ? "bg-emerald-50 border-emerald-100" : "bg-blue-50 border-blue-100"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className={task.status === 'Feito' ? "text-emerald-500" : "text-blue-500"} />
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            task.status === 'Feito' ? "text-emerald-700" : "text-blue-700"
                          )}>Tarefa</span>
                        </div>
                      </div>
                      <p className={cn(
                        "text-xs font-bold",
                        task.status === 'Feito' ? "text-emerald-900" : "text-blue-900"
                      )}>{task.title}</p>
                    </div>
                  ))}

                  {dayPosts.length > 0 ? dayPosts.map(post => (
                    <div 
                      key={post.id}
                      onClick={() => onEditPost(post)}
                      className={cn(
                        "p-3 rounded-xl border cursor-pointer hover:shadow-md transition-all",
                        post.status === 'Postado' ? "bg-white border-green-100" : "bg-white border-brand/20"
                      )}
                    >
                      <div className="mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{post.format}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 mb-1">{post.title}</p>
                      <p className="text-[10px] text-slate-500 line-clamp-2">{post.description}</p>
                    </div>
                  )) : dayHolidays.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-300">
                      <CalendarIcon size={24} className="mb-2 opacity-20" />
                      <p className="text-[10px] font-medium uppercase tracking-widest">Sem posts</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calendário</h1>
          <p className="text-slate-500 text-sm">Cronograma de postagens para {client.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                <button 
                  onClick={() => setViewMode('month')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    viewMode === 'month' ? "bg-brand/10 text-brand" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <LayoutGrid size={14} />
                  Mês
                </button>
                <button 
                  onClick={() => setViewMode('week')}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    viewMode === 'week' ? "bg-brand/10 text-brand" : "text-slate-500 hover:bg-slate-50"
                  )}
                >
                  <Columns size={14} />
                  Semana
                </button>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
            <button 
              onClick={handlePrev}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold px-4 min-w-[140px] text-center">
              {format(currentDate, viewMode === 'month' ? 'MMMM yyyy' : "'Semana de' d 'de' MMMM", { locale: ptBR })}
            </span>
            <button 
              onClick={handleNext}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button 
            onClick={() => setIsAddingDate(true)}
            className="bg-brand text-white px-4 py-2 rounded-xl text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Star size={16} />
            Data Comemorativa
          </button>
          <button 
            onClick={handleToday}
            className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Hoje
          </button>
        </div>
      </div>

      {viewMode === 'month' ? renderMonthView() : renderWeekView()}

      <AnimatePresence>
        {isAddingDate && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                    <Gift size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Nova Data</h2>
                    <p className="text-xs text-slate-500">Adicione um feriado ou comemoração</p>
                  </div>
                </div>
                <button onClick={() => setIsAddingDate(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Título do Evento</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Aniversário da Marca, Black Friday..."
                    value={newDateForm.title}
                    onChange={(e) => setNewDateForm({ ...newDateForm, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data</label>
                  <input 
                    type="date" 
                    value={newDateForm.date}
                    onChange={(e) => setNewDateForm({ ...newDateForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div className="p-6 bg-slate-50 flex items-center gap-3">
                <button
                  onClick={() => setIsAddingDate(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddManualDate}
                  disabled={!newDateForm.title || !newDateForm.date}
                  className="flex-1 py-3 bg-brand hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand/10"
                >
                  Adicionar ao Calendário
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
