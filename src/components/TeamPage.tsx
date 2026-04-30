import React, { useState, useRef } from 'react';
import { Plus, Mail, Shield, User, Trash2, Edit2, MoreVertical, X, AlertTriangle, Upload, Image as ImageIcon } from 'lucide-react';
import { TeamMember, UserRole } from '../types';
import { cn, generateTempId } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface TeamPageProps {
  team: TeamMember[];
  onAddMember: (member: TeamMember) => void;
  onUpdateMember: (member: TeamMember) => void;
  onDeleteMember: (id: string) => void;
}

export function TeamPage({ team, onAddMember, onUpdateMember, onDeleteMember }: TeamPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const member: TeamMember = {
      id: editingMember?.id || '', 
      name: formData.get('name') as string,
      role: formData.get('role') as UserRole,
      email: formData.get('email') as string,
      status: formData.get('status') as any,
      permission: formData.get('permission') as any,
      avatar: avatarPreview || (formData.get('avatar') as string) || editingMember?.avatar || `https://i.pravatar.cc/150?u=${Math.random()}`,
    };

    if (editingMember) {
      onUpdateMember(member);
    } else {
      onAddMember(member);
    }
    setIsModalOpen(false);
    setEditingMember(null);
    setAvatarPreview(null);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipe da Agência</h1>
          <p className="text-slate-500 text-sm">Gerencie os membros e permissões da sua equipe</p>
        </div>
        <button 
          onClick={() => {
            setEditingMember(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand/10"
        >
          <Plus size={18} />
          Convidar Membro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map((member) => (
          <div key={member.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <img src={member.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50" />
                <div>
                  <h3 className="font-bold text-slate-900">{member.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      member.role === 'Admin' ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                    )}>
                      {member.role}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      member.status === 'Inativo' ? "bg-slate-100 text-slate-600" : "bg-green-100 text-green-700"
                    )}>
                      {member.status || 'Ativo'}
                    </span>
                  </div>
                  {member.email && <p className="text-xs text-slate-400 mt-1">{member.email}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => {
                    setEditingMember(member);
                    setIsModalOpen(true);
                  }}
                  className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button 
                  onClick={() => setDeletingMember(member)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Mail size={14} />
                <span>Ativo</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingMember ? 'Editar Membro' : 'Convidar Membro'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    name="name"
                    type="text" 
                    required
                    defaultValue={editingMember?.name}
                    placeholder="Ex: João Silva"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    name="email"
                    type="email" 
                    required
                    defaultValue={editingMember?.email}
                    placeholder="Ex: joao@agencia.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select 
                    name="status"
                    required
                    defaultValue={editingMember?.status || 'Ativo'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 appearance-none"
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Permissão</label>
                  <select 
                    name="permission"
                    required
                    defaultValue={editingMember?.permission || 'Colaborador'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 appearance-none"
                  >
                    <option value="Colaborador">Colaborador</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Cargo / Função</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select 
                    name="role"
                    required
                    defaultValue={editingMember?.role}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 appearance-none"
                  >
                    <option value="Social Media">Social Media</option>
                    <option value="Social Midia">Social Midia</option>
                    <option value="Designer">Designer</option>
                    <option value="Copywriter">Copywriter</option>
                    <option value="Gestor de Tráfego">Gestor de Tráfego</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Imagem de Perfil</label>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative group">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                      {avatarPreview || editingMember?.avatar ? (
                        <img src={avatarPreview || editingMember?.avatar} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-slate-300" size={24} />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                      <Upload size={16} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload}
                      />
                    </label>
                  </div>
                  <div className="flex-1">
                    <input 
                      name="avatar"
                      type="text" 
                      value={avatarPreview || editingMember?.avatar || ''}
                      onChange={(e) => setAvatarPreview(e.target.value)}
                      placeholder="URL da imagem ou anexe ao lado"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Clique no ícone para anexar ou insira uma URL.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 bg-brand hover:opacity-90 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-brand/10"
                >
                  {editingMember ? 'Salvar Alterações' : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {deletingMember && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">Remover Membro</h2>
                <p className="text-slate-500 text-sm">
                  Tem certeza que deseja remover <span className="font-bold text-slate-700">{deletingMember.name}</span> da equipe? 
                  Esta ação não pode ser desfeita.
                </p>
              </div>
              <div className="p-6 bg-slate-50 flex items-center gap-3">
                <button
                  onClick={() => setDeletingMember(null)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteMember(deletingMember.id);
                    setDeletingMember(null);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-100"
                >
                  Confirmar Remoção
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
