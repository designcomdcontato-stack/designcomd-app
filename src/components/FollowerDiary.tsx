import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Users, 
  Calendar,
  ArrowUpRight,
  ChevronRight,
  History,
  Edit2,
  Trash2,
  X
} from 'lucide-react';
import { Client } from '../types';
import { cn } from '../lib/utils';

interface FollowerDiaryProps {
  client: Client;
  onUpdate: (history: { date: string; count: number }[]) => Promise<void>;
  onDeleteEntry?: (date: string) => Promise<void>;
}

export function FollowerDiary({ client, onUpdate, onDeleteEntry }: FollowerDiaryProps) {
  const getLocalDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [newEntry, setNewEntry] = useState({ date: getLocalDate(), count: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmDate, setDeleteConfirmDate] = useState<string | null>(null);
  
  // Sort history by date descending (using string comparison for reliability)
  const history = [...(client.followerHistory || [])].sort((a, b) => b.date.localeCompare(a.date));

  const handleAddEntry = async () => {
    if (!newEntry.count || !newEntry.date) return;
    const count = parseInt(newEntry.count);
    if (isNaN(count)) return;

    const existingIndex = (client.followerHistory || []).findIndex(h => h.date === newEntry.date);
    let newHistory;
    if (existingIndex >= 0) {
      newHistory = (client.followerHistory || []).map((h, i) => i === existingIndex ? { ...h, count } : h);
    } else {
      newHistory = [...(client.followerHistory || []), { date: newEntry.date, count }];
    }

    try {
      await onUpdate(newHistory);
      setNewEntry({ date: getLocalDate(), count: '' });
      setIsEditing(false);
    } catch (err) {
      // Error handled in parent toast
    }
  };

  const handleEdit = (entry: { date: string; count: number }) => {
    setNewEntry({ date: entry.date, count: entry.count.toString() });
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (date: string) => {
    if (onDeleteEntry) {
      try {
        await onDeleteEntry(date);
      } catch (err) {
        // Error handled in parent
      }
    } else {
      const newHistory = (client.followerHistory || []).filter(h => h.date !== date);
      onUpdate(newHistory);
    }
    setDeleteConfirmDate(null);
  };

  const handleCancelEdit = () => {
    setNewEntry({ date: getLocalDate(), count: '' });
    setIsEditing(false);
  };

  const calculateGrowth = (index: number) => {
    if (index === history.length - 1) return null;
    const current = history[index].count;
    const previous = history[index + 1].count;
    
    if (previous === 0) return { diff: current, percent: '100.0' };
    
    const diff = current - previous;
    const percent = ((diff / previous) * 100).toFixed(1);
    return { diff, percent };
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Diário de Seguidores</h1>
          <p className="text-slate-500 text-sm">Acompanhe o crescimento manual de {client.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Entry Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                {isEditing ? (
                  <Edit2 size={18} className="text-brand" />
                ) : (
                  <Plus size={18} className="text-brand" />
                )}
                {isEditing ? 'Editar Registro' : 'Nova Atualização'}
              </h3>
              {isEditing && (
                <button 
                  onClick={handleCancelEdit}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Data</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="date"
                    value={newEntry.date}
                    disabled={isEditing}
                    onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20",
                      isEditing && "opacity-60 cursor-not-allowed"
                    )}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Número de Seguidores</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="number"
                    value={newEntry.count}
                    onChange={(e) => setNewEntry({ ...newEntry, count: e.target.value })}
                    placeholder="Ex: 1250"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-brand/20"
                    autoFocus={isEditing}
                  />
                </div>
              </div>
              <button 
                onClick={handleAddEntry}
                className="w-full bg-brand hover:opacity-90 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-brand/10 transition-all flex items-center justify-center gap-2"
              >
                {isEditing ? 'Salvar Alteração' : 'Atualizar Diário'}
              </button>
            </div>
          </div>
        </div>

        {/* History List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={18} className="text-slate-400" />
                <h3 className="font-bold text-slate-900">Histórico de Crescimento</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{history.length} registros</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Seguidores</th>
                    <th className="px-6 py-4">Crescimento</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((entry, index) => {
                    const growth = calculateGrowth(index);
                    return (
                      <tr key={entry.date} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                          {formatDate(entry.date)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900">
                          {entry.count.toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          {growth ? (
                            <div className={cn(
                              "flex items-center gap-1 text-xs font-bold",
                              growth.diff >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {growth.diff >= 0 ? <ArrowUpRight size={14} /> : <TrendingUp size={14} className="rotate-180" />}
                              {growth.diff > 0 ? `+${growth.diff}` : growth.diff} ({growth.percent}%)
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEdit(entry)}
                              className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                              title="Editar"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => setDeleteConfirmDate(entry.date)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmDate && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Confirmar Exclusão</h3>
            <p className="text-slate-500 text-center mb-8">
              Tem certeza que deseja excluir o registro de <strong>{formatDate(deleteConfirmDate)}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirmDate(null)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(deleteConfirmDate)}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-100"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
