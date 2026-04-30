import React, { useState } from 'react';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  Instagram, 
  Facebook, 
  CheckSquare, 
  MessageSquare, 
  Paperclip, 
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Post, Client, PostStatus, PostFormat, PostChannel } from '../types';
import { cn, formatDate } from '../lib/utils';
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

interface PlanningProps {
  client: Client;
  posts: Post[];
  onAddPost: () => void;
  onEditPost: (post: Post) => void;
}

export function Planning({ client, posts, onAddPost, onEditPost }: PlanningProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const clientPosts = posts
    .filter(p => {
      if (p.clientId !== client.id) return false;
      
      const postDate = parseISO(p.date);
      return isWithinInterval(postDate, {
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate)
      });
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getStatusColor = (status: PostStatus) => {
    switch (status) {
      case 'Ideia': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Criando': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Revisão': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Enviar para cliente': return 'bg-brand/10 text-brand border-brand/20';
      case 'Aprovado': return 'bg-green-100 text-green-700 border-green-200';
      case 'Postado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Recusado': return 'bg-red-100 text-red-700 border-red-200';
      case 'Falha': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'Instagram': return <Instagram size={14} className="text-pink-600" />;
      case 'Facebook': return <Facebook size={14} className="text-blue-600" />;
      case 'TikTok': return <div className="w-3.5 h-3.5 bg-black rounded-full flex items-center justify-center text-[8px] text-white font-bold">T</div>;
      default: return null;
    }
  };

  const getStatusProgress = (status: PostStatus) => {
    switch (status) {
      case 'Ideia': return 10;
      case 'Criando': return 30;
      case 'Revisão': return 50;
      case 'Enviar para cliente': return 70;
      case 'Aprovado': return 90;
      case 'Postado': return 100;
      case 'Recusado': return 0;
      case 'Falha': return 0;
      default: return 0;
    }
  };

  const getProgressColor = (status: PostStatus) => {
    if (status === 'Recusado' || status === 'Falha') return 'bg-red-500';
    if (status === 'Postado') return 'bg-emerald-500';
    return 'bg-brand';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Planejamento</h1>
          <p className="text-slate-500 text-sm">Gerencie o calendário de conteúdo de {client.name}</p>
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
            onClick={onAddPost}
            className="flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-white px-4 py-2 rounded-xl font-semibold transition-all shadow-lg shadow-brand/20"
          >
            <Plus size={18} />
            Novo Post
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-6 py-4 font-bold">Conteúdo</th>
                <th className="px-6 py-4 font-bold">Data</th>
                <th className="px-6 py-4 font-bold min-w-[150px]">Status</th>
                <th className="px-6 py-4 font-bold">Progresso</th>
                <th className="px-6 py-4 font-bold">Canal</th>
                <th className="px-6 py-4 font-bold">Formato</th>
                <th className="px-6 py-4 font-bold">Responsável</th>
                <th className="px-6 py-4 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientPosts.length > 0 ? clientPosts.map((post) => (
                <tr 
                  key={post.id} 
                  className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                  onClick={() => onEditPost(post)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex-shrink-0 overflow-hidden border border-slate-200">
                        {post.image ? (
                          <img src={post.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <ImageIcon size={20} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate max-w-[200px]">{post.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <CheckSquare size={10} /> {(post.checklist || []).filter(c => c.completed).length}/{(post.checklist || []).length}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <MessageSquare size={10} /> {(post.comments || []).length}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Paperclip size={10} /> 0
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      {formatDate(post.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap",
                      getStatusColor(post.status)
                    )}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-full max-w-[100px] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>{getStatusProgress(post.status)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-500", getProgressColor(post.status))}
                          style={{ width: `${getStatusProgress(post.status)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      {(post.channels || []).map(channel => (
                        <div key={channel} className="flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-700 border border-slate-200">
                          {getChannelIcon(channel)}
                          {channel}
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{post.format}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center text-[10px] font-bold text-brand">
                        {post.responsible.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-sm text-slate-600">{post.responsible}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    Nenhum post encontrado para este cliente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
