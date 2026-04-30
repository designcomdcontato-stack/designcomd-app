import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Palette, User, Globe, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import { Client } from '../types';
import { cn, generateTempId } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ClientModalProps {
  client?: Client | null;
  onClose: () => void;
  onSave: (client: Client) => void;
}

export function ClientModal({ client, onClose, onSave }: ClientModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    logo: 'https://picsum.photos/seed/brand/200/200',
    primaryColor: '#4f46e5',
    responsible: '',
    socialMedia: ['Instagram'],
    editorialLine: [
      { id: '1', category: 'Dica', funnelType: 'Topo', objective: 'Impacto', order: 0 },
      { id: '2', category: 'Ação (evento, campanha)', funnelType: 'Meio', objective: 'Aproximação', order: 1 },
      { id: '3', category: 'Carro', funnelType: 'Base', objective: 'Produto', order: 2 },
    ],
    followerHistory: [{ date: new Date().toISOString().split('T')[0], count: 0 }]
  });

  const [newChannel, setNewChannel] = useState('');

  useEffect(() => {
    if (client) {
      setFormData(client);
    }
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData as Client,
      id: client?.id || generateTempId(),
    });
  };

  const toggleSocialMedia = (platform: string) => {
    const current = formData.socialMedia || [];
    if (current.includes(platform)) {
      setFormData({ ...formData, socialMedia: current.filter(p => p !== platform) });
    } else {
      setFormData({ ...formData, socialMedia: [...current, platform] });
    }
  };

  const addCustomChannel = () => {
    if (newChannel.trim()) {
      const current = formData.socialMedia || [];
      if (!current.includes(newChannel.trim())) {
        setFormData({ ...formData, socialMedia: [...current, newChannel.trim()] });
      }
      setNewChannel('');
    }
  };

  const removeSocialMedia = (platform: string) => {
    const current = formData.socialMedia || [];
    setFormData({ ...formData, socialMedia: current.filter(p => p !== platform) });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerLogoUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {client ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>
            <p className="text-sm text-slate-500">Configure as informações da marca</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Logo & Basic Info */}
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="relative group cursor-pointer"
                onClick={triggerLogoUpload}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleLogoUpload} 
                  className="hidden" 
                  accept="image/*"
                />
                <img 
                  src={formData.logo} 
                  alt="Logo" 
                  className="w-32 h-32 rounded-3xl object-cover border-4 border-slate-50 shadow-inner"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl">
                  <Upload size={24} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logo da Marca</p>
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Nome da Marca</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Apple, Nike, etc."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Responsável na Agência</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    required
                    value={formData.responsible}
                    onChange={e => setFormData({ ...formData, responsible: e.target.value })}
                    placeholder="Nome do gestor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Bio (Instagram Style)</label>
                <textarea 
                  value={formData.bio || ''}
                  onChange={e => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Descreva a marca, use emojis e links..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Color & Social Media */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Cor Principal</label>
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={formData.primaryColor}
                  onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-12 h-12 rounded-xl cursor-pointer border-none p-0 overflow-hidden"
                />
                <input 
                  type="text" 
                  value={formData.primaryColor}
                  onChange={e => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Redes Sociais Gerenciadas</label>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {(formData.socialMedia || []).map(platform => (
                  <div 
                    key={platform}
                    className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 text-indigo-600 px-3 py-2 rounded-xl"
                  >
                    <span className="text-xs font-bold">{platform}</span>
                    <button 
                      type="button"
                      onClick={() => removeSocialMedia(platform)}
                      className="text-indigo-400 hover:text-indigo-600 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sugestões Rápidas</label>
                <div className="flex flex-wrap gap-2">
                  {['Instagram', 'Facebook', 'TikTok', 'Youtube', 'LinkedIn', 'Twitter', 'Pinterest', 'Google Meu Negócio'].map(platform => (
                    <button
                      key={platform}
                      type="button"
                      disabled={formData.socialMedia?.includes(platform)}
                      onClick={() => toggleSocialMedia(platform)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg border text-[10px] font-bold transition-all",
                        formData.socialMedia?.includes(platform)
                          ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
                      )}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Adicionar Canal Personalizado</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={newChannel}
                    onChange={e => setNewChannel(e.target.value)}
                    placeholder="Nome do canal..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomChannel();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={addCustomChannel}
                    className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-indigo-100"
          >
            Salvar Cliente
          </button>
        </div>
      </motion.div>
    </div>
  );
}
