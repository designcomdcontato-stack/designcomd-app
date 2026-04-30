import React, { useState } from 'react';
import { Plus, Search, MoreHorizontal, Edit2, Trash2, ExternalLink, Mail, User, X, AlertTriangle, Users, Star, TrendingUp } from 'lucide-react';
import { Client, AgencySettings } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface ProfilesPageProps {
  clients: Client[];
  agencySettings: AgencySettings;
  activeClientId?: string;
  onAddClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onToggleFavorite?: (clientId: string) => void;
  onSelectClient?: (client: Client) => void;
}

export function ProfilesPage({ 
  clients, 
  agencySettings, 
  activeClientId,
  onAddClient, 
  onEditClient, 
  onDeleteClient, 
  onToggleFavorite,
  onSelectClient
}: ProfilesPageProps) {
  const [deletingClient, setDeletingClient] = useState<Client | null>(null);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Perfis de Clientes</h1>
          <p className="text-slate-500 text-sm">Gerencie as marcas e empresas que sua agência administra</p>
        </div>
        <button 
          onClick={onAddClient}
          className="flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand/10"
        >
          <Plus size={18} />
          Novo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {(clients || []).length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-slate-300 text-center">
            <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum cliente cadastrado</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
              Comece adicionando seu primeiro cliente para gerenciar suas redes sociais.
            </p>
            <button 
              onClick={onAddClient}
              className="flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand/10"
            >
              <Plus size={18} />
              Cadastrar Novo Cliente
            </button>
          </div>
        ) : (
          (clients || []).map((client) => {
            const isFavorite = agencySettings.preferredClientId === client.id;
            const isActive = activeClientId === client.id;
            
            return (
              <div 
                key={client.id} 
                onClick={() => onSelectClient?.(client)}
                className={cn(
                  "bg-white rounded-3xl border shadow-sm overflow-hidden group hover:shadow-md transition-all cursor-pointer relative",
                  isActive ? "ring-2 ring-brand border-transparent shadow-brand/10" : "border-slate-200"
                )}
              >
                <div className="h-2" style={{ backgroundColor: client.primaryColor }}></div>
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img src={client.logo} alt="" className="w-14 h-14 rounded-2xl object-cover border border-slate-100" />
                      <div>
                        <h3 className="font-bold text-slate-900">{client.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {(client.socialMedia || []).map(sm => (
                            <span key={sm} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sm}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite?.(client.id);
                        }}
                        className={cn(
                          "p-2 rounded-xl transition-colors",
                          isFavorite 
                            ? "text-amber-500 bg-amber-50 shadow-sm shadow-amber-100" 
                            : "text-slate-400 hover:text-amber-500 hover:bg-amber-50"
                        )}
                        title={isFavorite ? "Remover dos preferidos" : "Marcar como preferido"}
                      >
                        <Star size={18} fill={isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditClient(client);
                        }}
                        className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingClient(client);
                        }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <User size={16} className="text-slate-400" />
                      <span>Responsável: <span className="font-semibold text-slate-900">{client.responsible}</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      <TrendingUp size={16} className="text-slate-400" />
                      <span>Seguidores: <span className="font-semibold text-slate-900">
                        {[...(client.followerHistory || [])].sort((a, b) => b.date.localeCompare(a.date))[0]?.count.toLocaleString() || 0}
                      </span></span>
                    </div>
                  </div>

                  {isActive && (
                    <div className="pt-2">
                      <div className="text-[10px] uppercase font-bold text-brand bg-brand/5 py-1 px-3 rounded-full inline-block">
                        Ativo agora
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AnimatePresence>
        {deletingClient && (
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
                <h2 className="text-xl font-bold text-slate-900 mb-2">Excluir Cliente</h2>
                <p className="text-slate-500 text-sm">
                  Tem certeza que deseja excluir o perfil de <span className="font-bold text-slate-700">{deletingClient.name}</span>? 
                  Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
                </p>
              </div>
              <div className="p-6 bg-slate-50 flex items-center gap-3">
                <button
                  onClick={() => setDeletingClient(null)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    onDeleteClient(deletingClient.id);
                    setDeletingClient(null);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-red-100"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
