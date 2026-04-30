import React, { useState } from 'react';
import { 
  Pencil, 
  Trash2, 
  X,
  Plus, 
  MoreHorizontal, 
  Calendar, 
  CheckCircle2,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Task, Client, TaskStatus, TeamMember } from '../types';
import { cn, formatDate, generateTempId } from '../lib/utils';
import { supabase } from '../lib/supabaseClient';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  isWithinInterval, 
  addMonths, 
  subMonths,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface TasksPageProps {
  client: Client;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  team: TeamMember[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onRefresh?: () => void;
}

export function TasksPage({ client, tasks, setTasks, team, onAddTask, onUpdateTask, onDeleteTask, onRefresh }: TasksPageProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const clientTasks = (tasks || []).filter(t => {
    if (t.clientId !== client.id) return false;
    
    const taskDate = parseISO(t.deliveryDate);
    return isWithinInterval(taskDate, {
      start: startOfMonth(selectedDate),
      end: endOfMonth(selectedDate)
    });
  });

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

  const getStatusProgress = (task: Task) => {
    if (task.status === 'Feito') return 100;

    const checklist = task.checklist || [];
    if (checklist.length > 0) {
      const completed = checklist.filter(c => c.completed).length;
      const checklistProgress = (completed / checklist.length) * 100;
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

  const getProgressColor = (status: TaskStatus) => {
    if (status === 'Feito') return 'bg-emerald-500';
    if (status === 'Pausado') return 'bg-orange-500';
    return 'bg-brand';
  };

  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
    } else {
      setEditingTask(null);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tarefas & Projetos</h1>
          <p className="text-slate-500 text-sm">Controle as entregas e prazos de {client.name}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold px-4 min-w-[120px] text-center capitalize">
              {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button 
              onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-brand/20"
          >
            <Plus size={18} />
            Nova Tarefa
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Tarefa / Projeto</th>
                <th className="px-6 py-4 font-bold">Solicitante</th>
                <th className="px-6 py-4 font-bold">Entrega</th>
                <th className="px-6 py-4 font-bold min-w-[150px]">Status</th>
                <th className="px-6 py-4 font-bold">Progresso</th>
                <th className="px-6 py-4 font-bold">Responsável</th>
                <th className="px-6 py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientTasks.length > 0 ? clientTasks.map((task) => (
                <tr 
                  key={task.id} 
                  className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => handleOpenModal(task)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand transition-colors">
                        <CheckCircle2 size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{task.title}</p>
                        {task.description && (
                          <p className="text-[10px] text-slate-400 truncate max-w-[200px]">{task.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User size={14} className="text-slate-400" />
                      {task.requester}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      {formatDate(task.deliveryDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap",
                      getStatusColor(task.status)
                    )}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full max-w-[100px] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>{getStatusProgress(task)}%</span>
                        {(task.checklist || []).length > 0 && (
                          <span className="text-slate-400 font-medium">
                            {(task.checklist || []).filter(c => c.completed).length}/{(task.checklist || []).length}
                          </span>
                        )}
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", getProgressColor(task.status))}
                          style={{ width: `${getStatusProgress(task)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                         {task.responsible.charAt(0)}
                       </div>
                       {task.responsible}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleOpenModal(task)}
                        className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-all"
                        title="Editar Tarefa"
                      >
                        <Pencil size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma tarefa encontrada para este mês.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TaskModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => {
          if (editingTask) {
            onUpdateTask({ ...editingTask, ...data });
          } else {
            onAddTask({
              ...data,
              id: generateTempId(),
              clientId: client.id
            } as Task);
          }
          setIsModalOpen(false);
        }}
        task={editingTask}
        team={team}
        onRefresh={onRefresh}
      />
    </div>
  );
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Task>) => void;
  task: Task | null;
  team: TeamMember[];
  onRefresh?: () => void;
}

function TaskModal({ isOpen, onClose, onSave, task, team, onRefresh }: TaskModalProps) {
  console.log("RENDERIZANDO TASKMODAL. Task:", task?.id, "isOpen:", isOpen);
  const [formData, setFormData] = useState<Partial<Task>>(
    task || {
      title: '',
      requester: '',
      deliveryDate: format(new Date(), 'yyyy-MM-dd'),
      status: 'Fazer',
      responsible: '',
      description: '',
      checklist: []
    }
  );

  const [newChecklistItem, setNewChecklistItem] = useState('');

  const handleDeleteTask = async () => {
    console.log("CLIQUE NO BOTÃO FUNCIONOU");
    console.log("BOTÃO DELETE CLICADO");

    if (!task?.id) {
      alert("Task sem ID");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .delete()
        .eq("id", task.id)
        .select();

      console.log("DELETE RESULT:", { data, error });

      if (error) {
        alert("Erro ao excluir: " + error.message);
        return;
      }

      if (!data || data.length === 0) {
        alert("Nenhuma tarefa foi deletada.");
        return;
      }

      alert("Tarefa excluída com sucesso");
      onClose();
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (err: any) {
      console.error("ERRO:", err);
      alert("Erro ao excluir");
    }
  };

  React.useEffect(() => {
    if (task) {
      setFormData(task);
    } else {
      setFormData({
        title: '',
        requester: '',
        deliveryDate: format(new Date(), 'yyyy-MM-dd'),
        status: 'Fazer',
        responsible: '',
        description: '',
        checklist: []
      });
    }
  }, [task, team]);

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      text: newChecklistItem,
      completed: false
    };
    setFormData(prev => ({
      ...prev,
      checklist: [...(prev.checklist || []), newItem]
    }));
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: (prev.checklist || []).map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    }));
  };

  const removeChecklistItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      checklist: (prev.checklist || []).filter(item => item.id !== id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.requester) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    onSave(formData);
  };

  const statusOptions: TaskStatus[] = ['Fazer', 'Em andamento', 'Pausado', 'Aguardando', 'Revisão', 'Aprovação', 'Feito'];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{task ? 'Editar Tarefa' : 'Nova Tarefa'}</h2>
                <p className="text-xs text-slate-500 mt-1">Defina os detalhes da entrega</p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Tarefa / Projeto*</label>
                    <input 
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all font-bold"
                      placeholder="Nome da tarefa"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Solicitante*</label>
                    <input 
                      type="text"
                      value={formData.requester}
                      onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                      placeholder="Quem solicitou?"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Data da Entrega</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="date"
                        value={formData.deliveryDate}
                        onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Responsável</label>
                    <input 
                      type="text"
                      value={formData.responsible || ''}
                      onChange={(e) => setFormData({ ...formData, responsible: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all font-bold"
                      placeholder="Nome do responsável"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Checklist de Etapas</label>
                    <span className="text-[10px] font-bold text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                      Progresso: {(formData.checklist || []).length > 0 
                        ? Math.round(((formData.checklist || []).filter(c => c.completed).length / (formData.checklist || []).length) * 100) 
                        : 0}%
                    </span>
                  </div>
                  
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-hide">
                    {formData.checklist?.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 group">
                        <button 
                          type="button"
                          onClick={() => toggleChecklistItem(item.id)}
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center transition-all",
                            item.completed ? "bg-emerald-500 text-white" : "border-2 border-slate-300 hover:border-brand"
                          )}
                        >
                          {item.completed && <CheckCircle size={14} />}
                        </button>
                        <span className={cn(
                          "flex-1 text-sm transition-all",
                          item.completed ? "text-slate-400 line-through" : "text-slate-700"
                        )}>
                          {item.text}
                        </span>
                        <button 
                          type="button"
                          onClick={() => removeChecklistItem(item.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newChecklistItem}
                      onChange={(e) => setNewChecklistItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addChecklistItem();
                        }
                      }}
                      placeholder="Adicionar nova etapa..."
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                    <button 
                      type="button"
                      onClick={addChecklistItem}
                      className="bg-brand/10 text-brand p-2 rounded-xl hover:bg-brand hover:text-white transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Status</label>
                  <div className="flex flex-wrap gap-2">
                    {statusOptions.map(option => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setFormData({ ...formData, status: option })}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all",
                          formData.status === option
                            ? "bg-brand text-white border-brand shadow-lg shadow-brand/20"
                            : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descrição / Observações</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all h-24 resize-none"
                    placeholder="Detalhes adicionais da tarefa..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-4">
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-4 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-brand text-white rounded-2xl font-bold shadow-xl shadow-brand/20 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={18} />
                    Salvar Tarefa
                  </button>
                </div>
                
                {task && (
                  <button 
                    type="button"
                    onClick={() => {
                      console.log("CLIQUE NO BOTÃO FUNCIONOU");
                      handleDeleteTask();
                    }}
                    style={{ zIndex: 9999, position: "relative", cursor: "pointer" }}
                    className="w-full py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-2xl transition-all flex items-center justify-center gap-2 border border-red-100 mt-2"
                  >
                    <Trash2 size={16} />
                    Excluir tarefa
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
