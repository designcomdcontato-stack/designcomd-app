import React, { useState, useRef } from 'react';
import { 
  X, 
  CheckSquare, 
  MessageSquare, 
  Paperclip, 
  Clock, 
  Calendar, 
  Target,
  Send,
  Trash2,
  Image as ImageIcon,
  BarChart3,
  Plus,
  FileText
} from 'lucide-react';
import { Post, Client, PostStatus, PostFormat, EditorialItem, TeamMember } from '../types';
import { cn, generateTempId } from '../lib/utils';
import { supabaseService } from '../services/supabaseService';

interface PostModalProps {
  post: Post;
  client: Client;
  team: TeamMember[];
  onClose: () => void;
  onSave: (updatedPost: Post) => void;
  onDelete: (postId: string) => void;
}

export function PostModal({ post, client, team, onClose, onSave, onDelete }: PostModalProps) {
  const [editedPost, setEditedPost] = useState<Post>(() => {
    // Automatic suggestion for Social Media role on new posts
    if (!post.id && team.length > 0) {
      const suggested = team.find(m => 
        (m.role === 'Social Media' || m.role === 'Social Midia') && m.status === 'Ativo'
      );
      if (suggested) {
        return {
          ...post,
          responsibleId: suggested.id,
          responsible: suggested.name
        };
      }
    }
    return { ...post };
  });

  React.useEffect(() => {
    let active = true;
    if (post.id && !editedPost.image) {
      supabaseService.getPostImage(post.id).then(img => {
        if (active && img) {
          setEditedPost(prev => ({ ...prev, image: img }));
        }
      }).catch(err => {
        console.warn('PostModal: failed to load lazy image:', err);
      });
    }
    return () => {
      active = false;
    };
  }, [post.id]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [newComment, setNewComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedPost({ ...editedPost, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSave = () => {
    onSave(editedPost);
    onClose();
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: generateTempId(),
      text: newChecklistItem,
      completed: false
    };
    setEditedPost({
      ...editedPost,
      checklist: [...editedPost.checklist, newItem]
    });
    setNewChecklistItem('');
  };

  const toggleChecklistItem = (id: string) => {
    setEditedPost({
      ...editedPost,
      checklist: editedPost.checklist.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    });
  };

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: generateTempId(),
      user: 'Agência Criativa',
      text: newComment,
      date: new Date().toISOString()
    };
    setEditedPost({
      ...editedPost,
      comments: [...editedPost.comments, comment]
    });
    setNewComment('');
  };

  const statusOptions: PostStatus[] = [
    'Ideia', 'Criando', 'Revisão', 'Enviar para cliente', 
    'Aprovado', 'Postado', 'Recusado', 'Falha'
  ];

  const formatOptions: PostFormat[] = ['Estático', 'Carrossel', 'Reels', 'Story', 'Vídeo'];
  const channelOptions = (client.socialMedia || []).length > 0 ? client.socialMedia : ['Instagram', 'Facebook', 'TikTok'];

  const toggleChannel = (channel: string) => {
    const currentChannels = editedPost.channels || [];
    if (currentChannels.includes(channel)) {
      setEditedPost({ ...editedPost, channels: currentChannels.filter(c => c !== channel) });
    } else {
      setEditedPost({ ...editedPost, channels: [...currentChannels, channel] });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditedPost({ ...editedPost, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div 
        className="bg-white w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <ImageIcon size={20} />
            </div>
            <div>
              <input 
                value={editedPost.title}
                onChange={(e) => setEditedPost({ ...editedPost, title: e.target.value })}
                className="text-lg font-bold text-slate-900 bg-transparent border-none focus:ring-0 p-0 w-full"
                placeholder="Título do Post"
              />
              <p className="text-xs text-slate-500">Editando post para {client.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onDelete(post.id)}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <Trash2 size={20} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          {/* Left Column: Content & Media */}
          <div className="flex-1 p-8 space-y-8 border-r border-slate-100">
            {/* Media Preview */}
            <div 
              className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer"
              onClick={triggerImageUpload}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
              {editedPost.image ? (
                <>
                  <img src={editedPost.image} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white text-slate-900 px-4 py-2 rounded-xl text-sm font-bold shadow-lg">Alterar Imagem</button>
                  </div>
                </>
              ) : (
                <>
                  <ImageIcon size={48} className="text-slate-300 mb-4" />
                  <p className="text-sm font-medium text-slate-500">Arraste uma imagem ou clique para upload</p>
                  <p className="text-xs text-slate-400 mt-1">PNG, JPG até 10MB</p>
                </>
              )}
            </div>

            {/* Description */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                Legenda / Descrição
              </label>
              <textarea 
                value={editedPost.description}
                onChange={(e) => setEditedPost({ ...editedPost, description: e.target.value })}
                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                placeholder="Escreva a legenda do post aqui..."
              />
            </div>

            {/* Metrics Section (if posted) */}
            {editedPost.status === 'Postado' && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 size={16} className="text-slate-400" />
                  Métricas do Post
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(editedPost.metrics || {})
                    .filter(([key]) => key !== 'impressions')
                    .map(([key, value]) => {
                      const labels: Record<string, string> = {
                      reach: 'Alcance',
                      plays: 'Reprodução',
                      likes: 'Curtidas',
                      comments: 'Comentários',
                      shares: 'Compartilhamentos',
                      saves: 'Salvos'
                    };
                    return (
                      <div key={key} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group/metric">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] mb-1 group-hover/metric:text-indigo-400 transition-colors">
                          {labels[key] || key}
                        </p>
                        <input 
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={value === 0 ? '' : value}
                          placeholder="0"
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setEditedPost({
                              ...editedPost,
                              metrics: { ...editedPost.metrics, [key]: parseInt(val) || 0 }
                            });
                          }}
                          className="w-full bg-transparent border-none focus:ring-0 p-0 text-2xl font-black text-slate-900 placeholder:text-slate-200"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Settings & Sidebar */}
          <div className="w-full lg:w-80 bg-slate-50/50 p-8 space-y-8 overflow-y-auto">
            {/* Status & Properties */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
                <select 
                  value={editedPost.status}
                  onChange={(e) => setEditedPost({ ...editedPost, status: e.target.value as PostStatus })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Data de Publicação</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="date"
                    value={editedPost.date}
                    onChange={(e) => setEditedPost({ ...editedPost, date: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Canais</label>
                  <div className="flex flex-wrap gap-2">
                    {channelOptions.map(opt => (
                      <button
                        key={opt}
                        onClick={() => toggleChannel(opt)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                          editedPost.channels?.includes(opt)
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                            : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                        )}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Formato</label>
                  <select 
                    value={editedPost.format}
                    onChange={(e) => setEditedPost({ ...editedPost, format: e.target.value as PostFormat })}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {formatOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Linha Editorial</label>
                <select 
                  value={editedPost.editorialItemId}
                  onChange={(e) => setEditedPost({ ...editedPost, editorialItemId: e.target.value })}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {(client.editorialLine || []).map(item => (
                    <option key={item.id} value={item.id}>{item.category}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Responsável</label>
                  {!post.id && (
                    <span className="text-[9px] font-black text-brand uppercase tracking-tighter animate-pulse">
                      Sugestão automática
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    list="team-members"
                    value={editedPost.responsible || ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      const member = team.find(m => m.name === name);
                      if (member) {
                        setEditedPost({ ...editedPost, responsibleId: member.id, responsible: member.name });
                      } else {
                        setEditedPost({ ...editedPost, responsibleId: undefined, responsible: name });
                      }
                    }}
                    placeholder="Selecione ou digite o responsável..."
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <datalist id="team-members">
                    {team.filter(m => m.status === 'Ativo' || m.id === editedPost.responsibleId).map(member => (
                      <option key={member.id} value={member.name}>{member.role}</option>
                    ))}
                  </datalist>
                </div>
              </div>

            </div>

            {/* Checklist */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare size={16} className="text-slate-400" />
                Checklist
              </label>
              <div className="space-y-2">
                {(editedPost.checklist || []).map(item => (
                  <div key={item.id} className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleChecklistItem(item.id)}
                      className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                        item.completed ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-300"
                      )}
                    >
                      {item.completed && <CheckSquare size={12} />}
                    </button>
                    <span className={cn("text-sm", item.completed ? "text-slate-400 line-through" : "text-slate-700")}>
                      {item.text}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addChecklistItem()}
                    placeholder="Adicionar item..."
                    className="flex-1 bg-transparent border-b border-slate-200 py-1 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button onClick={addChecklistItem} className="text-indigo-600 hover:text-indigo-700">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Comments */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare size={16} className="text-slate-400" />
                Comentários ({(editedPost.comments || []).length})
              </label>
              <div className="space-y-4">
                {(editedPost.comments || []).map(comment => (
                  <div key={comment.id} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-900">{comment.user}</span>
                      <span className="text-[10px] text-slate-400">{new Date(comment.date).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-100">{comment.text}</p>
                  </div>
                ))}
                <div className="relative">
                  <textarea 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none h-20"
                  />
                  <button 
                    onClick={addComment}
                    className="absolute right-2 bottom-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-4 border-t border-slate-100 flex items-center justify-end gap-3 bg-white">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
}

