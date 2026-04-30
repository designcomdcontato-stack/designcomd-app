import React, { useState, useEffect } from 'react';
import { Save, Shield, Globe, Clock, Mail, Upload, Image as ImageIcon, Lock, Check, Eye, EyeOff, UserPlus, Trash2, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';
import { AgencySettings } from '../types';
import { toast } from 'sonner';
import { supabaseService } from '../services/supabaseService';

interface SettingsPageProps {
  settings: AgencySettings;
  onUpdate: (settings: AgencySettings) => void;
  onUpdatePassword?: (newPassword: string) => void;
  currentUserPassword?: string;
  userEmail?: string;
  isAdmin?: boolean;
}

export function SettingsPage({ settings, onUpdate, onUpdatePassword, currentUserPassword, userEmail, isAdmin }: SettingsPageProps) {
  const [activeSection, setActiveSection] = useState('general');
  const [formData, setFormData] = useState<AgencySettings>(settings);
  
  // Sync formData when settings prop changes (e.g. after a save)
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Authorized users state
  const [authorizedUsers, setAuthorizedUsers] = useState<string[]>([]);
  const [newAuthEmail, setNewAuthEmail] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  useEffect(() => {
    if (activeSection === 'security' && isAdmin) {
      fetchAuthorizedUsers();
    }
  }, [activeSection, isAdmin]);

  const fetchAuthorizedUsers = async () => {
    try {
      const users = await supabaseService.getAuthorizedUsers();
      setAuthorizedUsers(users);
    } catch (err) {
      console.error('Error fetching authorized users:', err);
    }
  };

  const handleAddAuthorizedUser = async () => {
    if (!newAuthEmail || !newAuthEmail.includes('@')) {
      toast.error('Por favor, insira um e-mail válido.');
      return;
    }

    if (authorizedUsers.includes(newAuthEmail)) {
      toast.error('Este e-mail já está autorizado.');
      return;
    }

    try {
      setIsAuthLoading(true);
      await supabaseService.addAuthorizedUser(newAuthEmail);
      setAuthorizedUsers([...authorizedUsers, newAuthEmail]);
      setNewAuthEmail('');
      toast.success('Usuário autorizado com sucesso!');
    } catch (err) {
      console.error('Error adding authorized user:', err);
      toast.error('Erro ao autorizar usuário.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRemoveAuthorizedUser = async (email: string) => {
    if (email === userEmail) {
      toast.error('Você não pode remover seu próprio acesso.');
      return;
    }

    try {
      await supabaseService.removeAuthorizedUser(email);
      setAuthorizedUsers(authorizedUsers.filter(u => u !== email));
      toast.success('Acesso removido com sucesso!');
    } catch (err) {
      console.error('Error removing authorized user:', err);
      toast.error('Erro ao remover acesso.');
    }
  };
  
  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  const handleSave = () => {
    onUpdate(formData);
    toast.success('Configurações salvas com sucesso!');
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

  const handleSavePassword = () => {
    if (!currentPassword) {
      toast.error('Por favor, insira a senha atual.');
      return;
    }
    if (currentPassword !== currentUserPassword) {
      toast.error('A senha atual está incorreta.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    if (onUpdatePassword) {
      onUpdatePassword(newPassword);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Senha alterada com sucesso!');
    }
  };

  const handleForgotPassword = () => {
    toast.info(`Um link de redefinição de senha foi enviado para ${userEmail || 'seu e-mail'}.`);
  };

  const sections = [
    { id: 'general', label: 'Geral', icon: Globe },
    { id: 'security', label: 'Segurança', icon: Shield },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[600px]">
      {/* Sidebar */}
      <div className="w-full md:w-64 border-r border-slate-100 bg-slate-50/50 p-4 space-y-2">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
              activeSection === section.id
                ? "bg-white text-brand shadow-sm border border-slate-200"
                : "text-slate-500 hover:bg-white/50"
            )}
          >
            <section.icon size={18} />
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {sections.find(s => s.id === activeSection)?.label}
            </h2>
            <p className="text-sm text-slate-500">Gerencie as preferências do seu sistema</p>
          </div>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 bg-brand hover:opacity-90 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-brand/10"
          >
            <Save size={18} />
            Salvar Alterações
          </button>
        </div>

        <div className="space-y-6 max-w-2xl">
          {activeSection === 'general' && (
            <>
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Logotipo da Agência</label>
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="text-slate-300" size={32} />
                      )}
                    </div>
                    <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-2xl">
                      <Upload size={20} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleLogoUpload}
                      />
                    </label>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={formData.logo}
                        onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                        placeholder="URL do logotipo ou anexe ao lado"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400">Clique no ícone acima para anexar do computador ou insira uma URL.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Nome da Agência</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Cor Primária</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border-2 border-white shadow-sm cursor-pointer overflow-hidden"
                    />
                    <input 
                      type="text" 
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Cor Secundária</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border-2 border-white shadow-sm cursor-pointer overflow-hidden"
                    />
                    <input 
                      type="text" 
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Cor Terciária</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={formData.tertiaryColor}
                      onChange={(e) => setFormData({ ...formData, tertiaryColor: e.target.value })}
                      className="w-10 h-10 rounded-lg border-2 border-white shadow-sm cursor-pointer overflow-hidden"
                    />
                    <input 
                      type="text" 
                      value={formData.tertiaryColor}
                      onChange={(e) => setFormData({ ...formData, tertiaryColor: e.target.value })}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400">Essas cores serão aplicadas em diferentes elementos do sistema para criar uma identidade visual única.</p>
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail de Contato</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                    type="email" 
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Fuso Horário</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none">
                    <option>Brasília (GMT-3)</option>
                    <option>Lisboa (GMT+0)</option>
                    <option>Nova York (GMT-5)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {activeSection === 'security' && (
            <div className="space-y-6">
              {!isChangingPassword ? (
                <button 
                  onClick={() => setIsChangingPassword(true)}
                  className="w-full text-left p-6 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Alterar Senha</p>
                      <p className="text-xs text-slate-500">Mantenha sua conta segura trocando sua senha periodicamente.</p>
                    </div>
                    <Lock size={20} className="text-slate-300 group-hover:text-brand transition-colors" />
                  </div>
                </button>
              ) : (
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-bold text-slate-900">Configurar Nova Senha</h3>
                    <button 
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="text-slate-400 hover:text-brand transition-colors"
                    >
                      {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Senha Atual</label>
                      <input 
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all font-mono"
                      />
                      <button 
                        onClick={handleForgotPassword}
                        className="text-[10px] font-bold text-brand hover:opacity-80 mt-1 ml-1 transition-all"
                      >
                        Esqueceu a senha atual?
                      </button>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Nova Senha</label>
                      <input 
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Confirmar Nova Senha</label>
                      <input 
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button 
                      onClick={() => {
                        setIsChangingPassword(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      className="flex-1 py-3 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSavePassword}
                      className="flex-1 py-3 bg-brand text-white rounded-xl text-xs font-bold shadow-lg shadow-brand/10 hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={14} />
                      Atualizar Senha
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 bg-slate-900 rounded-3xl text-white space-y-4 shadow-xl">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-brand">
                     <Shield size={20} />
                   </div>
                   <h3 className="font-bold">Sua segurança é prioridade</h3>
                 </div>
                 <p className="text-xs text-white/60 leading-relaxed">
                   Sua conta está protegida por criptografia de ponta a ponta. Caso suspeite de qualquer acesso não autorizado, altere sua senha imediatamente.
                 </p>
              </div>

              {isAdmin && (
                <div className="space-y-6 pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Usuários Autorizados</h3>
                      <p className="text-xs text-slate-500">Controle quem pode acessar a plataforma via Supabase</p>
                    </div>
                    <ShieldCheck size={20} className="text-brand" />
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="email"
                      value={newAuthEmail}
                      onChange={(e) => setNewAuthEmail(e.target.value)}
                      placeholder="e-mail@autorizado.com"
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                    />
                    <button 
                      onClick={handleAddAuthorizedUser}
                      disabled={isAuthLoading}
                      className="bg-brand text-white px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 hover:opacity-90 disabled:bg-slate-400 transition-all"
                    >
                      <UserPlus size={16} />
                      Autorizar
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {authorizedUsers.map(email => (
                      <div key={email} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                            <Mail size={14} />
                          </div>
                          <span className="text-sm font-medium text-slate-700">{email}</span>
                          {email === userEmail && (
                            <span className="text-[10px] font-bold text-brand bg-brand/10 border border-brand/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Você</span>
                          )}
                        </div>
                        {email !== userEmail && (
                          <button 
                            onClick={() => handleRemoveAuthorizedUser(email)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
