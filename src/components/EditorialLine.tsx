import React, { useState } from 'react';
import { 
  Plus, 
  GripVertical, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  Target,
  Layers
} from 'lucide-react';
import { Client, EditorialItem } from '../types';
import { cn } from '../lib/utils';

interface EditorialLineProps {
  client: Client;
  onUpdate: (items: EditorialItem[]) => void;
  onDelete: (id: string) => Promise<void>;
}

export function EditorialLine({ client, onUpdate, onDelete }: EditorialLineProps) {
  const [items, setItems] = useState<EditorialItem[]>([...(client.editorialLine || [])].sort((a, b) => a.order - b.order));

  // Sync with prop when it updates from server (e.g. after save to get real IDs)
  React.useEffect(() => {
    setItems([...(client.editorialLine || [])].sort((a, b) => a.order - b.order));
  }, [client.editorialLine]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [categoriesList, setCategoriesList] = useState<string[]>([
    'Dica',
    'Notícia (comunicado)',
    'Trend (meme)',
    'Curiosidade',
    'Real ou Improvável',
    'Ed. Financeira',
    'Ação (evento, campanha)',
    'Empresa (dia a dia, bastidores)',
    'Data Comemorativa',
    'Motivacional (respiro, TBT)',
    'MKT quer saber',
    'Carro',
    'Consórcio',
    'ABAC (dados)'
  ]);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const categoryPresets: Record<string, string> = {
    'Dica': 'Topo',
    'Notícia (comunicado)': 'Topo',
    'Trend (meme)': 'Topo',
    'Curiosidade': 'Topo',
    'Real ou Improvável': 'Topo',
    'Ed. Financeira': 'Topo',
    'Ação (evento, campanha)': 'Meio',
    'Empresa (dia a dia, bastidores)': 'Meio',
    'Data Comemorativa': 'Meio',
    'Motivacional (respiro, TBT)': 'Meio',
    'MKT quer saber': 'Meio',
    'Carro': 'Base',
    'Consórcio': 'Base',
    'ABAC (dados)': 'Base'
  };

  const funnelTypes = ['Topo', 'Meio', 'Base'];

  const getObjectiveForFunnel = (type: string) => {
    switch (type) {
      case 'Topo': return 'Impacto';
      case 'Meio': return 'Aproximação';
      case 'Base': return 'Produto';
      default: return '';
    }
  };

  const [newItem, setNewItem] = useState({ 
    category: categoriesList[0],
    funnelType: 'Topo',
    objective: 'Impacto'
  });

  const handleCategoryChange = (category: string) => {
    const presetFunnel = categoryPresets[category];
    if (presetFunnel) {
      setNewItem({
        ...newItem,
        category,
        funnelType: presetFunnel,
        objective: getObjectiveForFunnel(presetFunnel)
      });
    } else {
      setNewItem({ ...newItem, category });
    }
  };

  const handleAdd = () => {
    if (!newItem.category) return;

    // Check for duplicates
    const isDuplicate = items.some(item => 
      item.category.toLowerCase() === newItem.category.toLowerCase()
    );

    if (isDuplicate) {
      alert('Esta categoria já existe na sua Linha Editorial.');
      return;
    }

    const item: EditorialItem = {
      id: `temp-${crypto.randomUUID()}`,
      category: newItem.category,
      funnelType: newItem.funnelType,
      objective: newItem.objective,
      order: items.length
    };
    const newItems = [...items, item];
    setItems(newItems);
    onUpdate(newItems);
    
    // Reset and apply preset for first category if available
    const firstCat = categoriesList[0];
    const firstPreset = categoryPresets[firstCat];
    setNewItem({ 
      category: firstCat,
      funnelType: firstPreset || 'Topo',
      objective: getObjectiveForFunnel(firstPreset || 'Topo')
    });
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    // If not in confirm mode, set to confirm mode
    if (deletingId !== id) {
      setDeletingId(id);
      return;
    }

    // If already in confirm mode and clicked again, proceed with delete
    setDeletingId(null);

    if (!id || (typeof id === 'string' && id.includes('temp-'))) {
      // For local items not yet in DB, just filter local state
      const newItems = items.filter(i => i.id !== id);
      setItems(newItems);
      onUpdate(newItems);
      return;
    }

    try {
      await onDelete(id);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<EditorialItem>) => {
    const newItems = items.map(i => {
      if (i.id === id) {
        const updated = { ...i, ...updates };
        
        // Automation if funnelType changes
        if (updates.funnelType) {
          updated.objective = getObjectiveForFunnel(updates.funnelType);
        }

        // Automation if category changes
        if (updates.category) {
          const presetFunnel = categoryPresets[updates.category];
          if (presetFunnel) {
            updated.funnelType = presetFunnel;
            updated.objective = getObjectiveForFunnel(presetFunnel);
          }
        }
        
        return updated;
      }
      return i;
    });
    setItems(newItems);
    onUpdate(newItems);
  };

  const handleFunnelChange = (type: string) => {
    setNewItem({ 
      ...newItem, 
      funnelType: type, 
      objective: getObjectiveForFunnel(type) 
    });
  };

  const handleAddCategory = () => {
    if (newCategoryName.trim() && categoriesList && !categoriesList.includes(newCategoryName.trim())) {
      setCategoriesList([...categoriesList, newCategoryName.trim()]);
      setNewItem({ ...newItem, category: newCategoryName.trim() });
      setNewCategoryName('');
      setIsAddingCategory(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Linha Editorial</h1>
          <p className="text-slate-500 text-sm">Defina os pilares de conteúdo para {client.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add New Item Card */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24">
            <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Plus size={18} className="text-brand" />
              Adicionar Novo Pilar
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tipo do Funil</label>
                <div className="flex gap-2">
                  {funnelTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => handleFunnelChange(type)}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-lg border transition-all",
                        newItem.funnelType === type 
                          ? "bg-brand text-white shadow-md shadow-brand/10" 
                          : "bg-white border-slate-200 text-slate-600 hover:border-brand/30"
                      )}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Objetivo</label>
                <input 
                  type="text"
                  value={newItem.objective}
                  onChange={(e) => setNewItem({ ...newItem, objective: e.target.value })}
                  placeholder="Selecione um tipo de funil"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Categoria</label>
                  <button 
                    onClick={() => setIsAddingCategory(!isAddingCategory)}
                    className="text-[10px] font-bold text-brand hover:underline"
                  >
                    {isAddingCategory ? 'Cancelar' : '+ Nova'}
                  </button>
                </div>
                
                {isAddingCategory ? (
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Nome da categoria"
                      className="flex-1 px-4 py-2.5 bg-white border border-brand/30 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                    <button 
                      onClick={handleAddCategory}
                      className="p-2 bg-brand text-white rounded-xl"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                ) : (
                  <select 
                    value={newItem.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236B7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-right-4 bg-no-repeat"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>

              <button 
                onClick={handleAdd}
                className="w-full bg-brand hover:opacity-90 text-white py-2.5 rounded-xl font-bold shadow-lg shadow-brand/10 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Adicionar Pilar
              </button>
            </div>
          </div>
        </div>

        {/* List of Items */}
        <div className="lg:col-span-2 space-y-6">
          {funnelTypes.map(type => {
            const typeItems = items.filter(i => i.funnelType === type);
            return (
              <div key={type} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers size={18} className="text-slate-400" />
                    <h3 className="font-bold text-slate-900">{type} do Funil</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{typeItems.length} temas</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {typeItems.length > 0 ? typeItems.map((item) => (
                    <div key={item.id} className="group flex flex-col gap-2 px-6 py-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="text-slate-300 cursor-grab active:cursor-grabbing">
                          <GripVertical size={18} />
                        </div>
                        
                        {editingId === item.id ? (
                          <div className="flex-1 flex flex-col gap-3 p-3 bg-white border border-brand/20 rounded-xl">
                            <div className="grid grid-cols-2 gap-3">
                              <select
                                value={item.funnelType}
                                onChange={(e) => handleUpdateItem(item.id, { funnelType: e.target.value as any })}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                              >
                                {funnelTypes.map(ft => (
                                  <option key={ft} value={ft}>{ft}</option>
                                ))}
                              </select>
                              <select
                                value={item.category}
                                onChange={(e) => handleUpdateItem(item.id, { category: e.target.value })}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand/10"
                              >
                                {categoriesList.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-3">
                              <input 
                                value={item.objective}
                                readOnly
                                disabled
                                className="flex-1 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700"
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="px-3 py-1 bg-brand text-white text-xs font-bold rounded-lg transition-all"
                              >
                                Salvar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-slate-900">{item.category}</span>
                                {item.objective && (
                                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full uppercase tracking-wider border border-slate-200">
                                    {item.objective}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                type="button"
                                onClick={() => setEditingId(item.id)}
                                className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-colors cursor-pointer"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(item.id);
                                }}
                                className={cn(
                                  "p-2 rounded-lg transition-all cursor-pointer flex items-center gap-1",
                                  deletingId === item.id 
                                    ? "bg-red-600 text-white animate-pulse" 
                                    : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                                )}
                                title={deletingId === item.id ? "Clique para confirmar exclusão" : "Excluir"}
                              >
                                <Trash2 size={16} />
                                {deletingId === item.id && <span className="text-[10px] font-bold pr-1">Confirmar?</span>}
                              </button>
                              {deletingId === item.id && (
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingId(null);
                                  }}
                                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                  title="Cancelar exclusão"
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )) : (
                    <div className="px-6 py-8 text-center text-slate-400 text-sm">
                      Nenhum tema cadastrado para esta categoria.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
