import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MoreHorizontal, 
  Trash2, 
  Edit2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  History,
  Target,
  X,
  CheckCircle,
  Tag,
  Circle,
  FileText,
  Upload,
  Download
} from 'lucide-react';
import { Client, CommemorativeDate, CommemorativeDateCategory, PostStatus } from '../types';
import { cn, formatDate, parseSafeDate, generateTempId } from '../lib/utils';
import { format, startOfMonth, endOfMonth, isWithinInterval, addMonths, subMonths, parseISO, isSameMonth, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface AdditionalDatesPageProps {
  activeClient: Client | null;
  dates: CommemorativeDate[];
  onAddDate: (date: CommemorativeDate) => void;
  onAddDates: (dates: CommemorativeDate[]) => void;
  onUpdateDate: (date: CommemorativeDate) => void;
  onDeleteDate: (id: string) => void;
}

export function AdditionalDatesPage({ activeClient, dates, onAddDate, onAddDates, onUpdateDate, onDeleteDate }: AdditionalDatesPageProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<CommemorativeDate | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const clientId = activeClient?.id;

  // Only show dates for the current active client
  // Manual dates MUST have a clientId matching the active client.
  const manualDates = (dates || []).filter(d => {
    // 1. If it belongs to the active client, we show it
    if (d.clientId && d.clientId === clientId) return true;
    
    // 2. If it is global (no clientId) AND automatic/standard holiday, we show it
    // Note: manual dates with NULL client_id are filtered out as they are non-isolated legacy data
    if (!d.clientId && d.type === 'automatic') return true;
    
    return false;
  });

  const filteredDates = manualDates.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (d.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter;
    
    // Filter by month - using string comparison to avoid timezone shifts
    const itemDate = parseSafeDate(d.date);
    if (!itemDate || !isValid(itemDate)) return false;
    
    const itemYearMonth = d.date.substring(0, 7); // "YYYY-MM"
    const selectedYearMonth = format(selectedDate, 'yyyy-MM');
    const matchesMonth = itemYearMonth === selectedYearMonth;
    
    return matchesSearch && matchesCategory && matchesMonth;
  }).sort((a, b) => a.date.localeCompare(b.date));

  const defaultCategories: string[] = [
    'Data comemorativa', 
    'Aniversário', 
    'Tempo de Empresa', 
    'Aniversariante do mês', 
    'Reunião de ciclo'
  ];

  const categories = Array.from(new Set([
    ...defaultCategories,
    ...(dates || []).map(d => d.category).filter(Boolean)
  ])).sort();

  const handleOpenModal = (date?: CommemorativeDate) => {
    if (!activeClient && !date) {
      toast.error('Selecione um cliente primeiro.');
      return;
    }
    if (date) {
      setEditingDate(date);
    } else {
      setEditingDate(null);
    }
    setIsModalOpen(true);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""),
      complete: (results) => {
        const data = results.data as any[];
        let addedCount = 0;
        let errorCount = 0;
        const newDatesToImport: CommemorativeDate[] = [];

        if (data.length === 0) {
          toast.error('O arquivo parece estar vazio ou não pôde ser lido corretamente.');
          return;
        }

        data.forEach((row, index) => {
          // Try to find columns even if delimiter was wrong
          // Excel sometimes exports with BOM or mixed separators
          let finalRow: any = {};
          
          // Clean keys and values from potential BOM or invisible chars
          Object.entries(row).forEach(([k, v]) => {
            const cleanK = k.replace(/^\uFEFF/, '').trim();
            finalRow[cleanK] = typeof v === 'string' ? v.trim() : v;
          });

          // Check if it's a "single column failure" (happens with semicolon CSVs in some browsers)
          if (Object.keys(finalRow).length === 1 && String(Object.values(finalRow)[0]).includes(';')) {
             const rawKey = Object.keys(finalRow)[0];
             const rawVal = String(finalRow[rawKey]);
             const headers = rawKey.split(';');
             const vals = rawVal.split(';');
             finalRow = {};
             headers.forEach((h, i) => {
               const cleanH = h.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
               finalRow[cleanH] = vals[i] ? vals[i].trim() : '';
             });
          }

          const title = finalRow['titulo'] || finalRow['title'] || finalRow['evento'] || finalRow['nome'];
          const dateRaw = finalRow['data'] || finalRow['date'] || finalRow['quando'];
          const categoryRaw = finalRow['categoria'] || finalRow['category'] || finalRow['tipo'];
          const description = finalRow['descricao'] || finalRow['description'] || finalRow['obs'] || '';
          const statusRaw = finalRow['status'] || finalRow['situacao'] || 'Ideia';

          const parsedDate = parseSafeDate(String(dateRaw || '').trim());

          if (title && parsedDate && isValid(parsedDate)) {
            // Map category to valid enum values
            let category: CommemorativeDateCategory = 'Data comemorativa';
            const catLower = String(categoryRaw || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if (catLower.includes('aniversario')) category = 'Aniversário';
            else if (catLower.includes('reuniao')) category = 'Reunião';
            else if (catLower.includes('tempo de empresa')) category = 'Tempo de Empresa';

            newDatesToImport.push({
              id: `import-${Date.now()}-${index}`,
              title: String(title).trim(),
              date: format(parsedDate, 'yyyy-MM-dd'),
              category,
              description: String(description).trim(),
              status: (statusRaw as PostStatus) || 'Ideia',
              type: 'manual'
            });
            addedCount++;
          } else {
            console.error('Falha na linha ' + (index + 1) + ':', { title, dateRaw, parsedDate });
            errorCount++;
          }
        });

        if (newDatesToImport.length > 0) {
          onAddDates(newDatesToImport);
          toast.success(`${addedCount} datas importadas com sucesso!`);
        }
        if (errorCount > 0) {
          toast.error(`${errorCount} linhas ignoradas. Verifique o console (F12) para detalhes sobre erros de título ou data.`);
        }
        
        e.target.value = '';
      },
      error: (error) => {
        toast.error('Erro ao processar o arquivo CSV: ' + error.message);
      }
    });
  };

  const downloadTemplate = () => {
    const csvContent = "Titulo,Data,Categoria,Descricao,Status\nExemplo de Evento,25/04/2026,Data comemorativa,Uma breve descrição do evento,Ideia\nAniversário do João,26/04/2026,Aniversário,Festa surpresa,Criando";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "modelo_importacao_datas.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getCategoryColor = (category: CommemorativeDateCategory) => {
    switch (category) {
      case 'Data comemorativa': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Aniversário': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Tempo de Empresa': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Aniversariante do mês': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Reunião de ciclo': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status?: PostStatus) => {
    switch (status) {
      case 'Ideia': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'Criando': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'Revisão': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'Enviar para cliente': return 'bg-amber-100 text-amber-600 border-amber-200';
      case 'Aprovado': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      case 'Postado': return 'bg-green-100 text-green-600 border-green-200';
      case 'Recusado': return 'bg-red-100 text-red-600 border-red-200';
      case 'Falha': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-slate-50 text-slate-400 border-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Datas Adicionais</h1>
          <p className="text-slate-500 text-sm">Gerencie eventos, aniversários e reuniões personalizadas</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200 shadow-sm transition-all duration-300">
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

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                if (!activeClient) {
                  toast.error('Selecione um cliente primeiro.');
                  return;
                }
                downloadTemplate();
              }}
              className="p-2.5 text-slate-400 hover:text-brand hover:bg-brand/5 rounded-xl transition-all border border-transparent hover:border-brand/10 group relative"
              title="Baixar modelo CSV"
            >
              <Download size={18} />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Baixar Modelo CSV</span>
            </button>
            
            <label className={cn(
              "flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2.5 rounded-xl font-bold transition-all cursor-pointer shadow-sm active:scale-95",
              !activeClient && "opacity-50 cursor-not-allowed grayscale"
            )}>
              <Upload size={18} />
              <span className="hidden sm:inline">Importar CSV</span>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                disabled={!activeClient}
                onChange={(e) => {
                  if (!activeClient) {
                    toast.error('Selecione um cliente primeiro.');
                    return;
                  }
                  handleImportCSV(e);
                }}
              />
            </label>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-brand hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-brand/20 active:scale-95"
          >
            <Plus size={18} />
            Nova Data
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Pesquisar por título ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all cursor-pointer min-w-[180px]"
          >
            <option value="all">Todas as categorias</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="px-8 py-5 font-bold">Data Principal</th>
                <th className="px-8 py-5 font-bold">Categoria</th>
                <th className="px-8 py-5 font-bold">Status</th>
                <th className="px-8 py-5 font-bold">Descrição</th>
                <th className="px-8 py-5 font-bold">Data</th>
                <th className="px-8 py-5 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDates.length > 0 ? filteredDates.map((date) => (
                <tr 
                  key={date.id} 
                  className="group hover:bg-slate-50/50 transition-colors cursor-pointer animate-in fade-in slide-in-from-left-2 duration-300"
                  onClick={() => handleOpenModal(date)}
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-transform group-hover:scale-110",
                        getCategoryColor(date.category).split(' ')[0]
                      )}>
                        {date.category === 'Aniversário' ? <History size={24} className="text-emerald-600" /> : 
                         date.category === 'Tempo de Empresa' ? <TrendingUp size={24} className="text-blue-600" /> :
                         <Target size={24} className="text-amber-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">{date.title}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{date.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border whitespace-nowrap",
                      getCategoryColor(date.category)
                    )}>
                      {date.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    {date.status ? (
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5 w-fit shadow-sm",
                        getStatusColor(date.status)
                      )}>
                        <Circle size={8} className="fill-current" />
                        {date.status}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic font-medium">Não definido</span>
                    )}
                  </td>
                  <td className="px-8 py-5 max-w-[300px]">
                    <p className="text-xs text-slate-500 line-clamp-2 italic leading-relaxed">
                      {date.description || 'Sem descrição.'}
                    </p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2.5 text-sm font-bold text-slate-700">
                      <div className="p-1.5 bg-slate-100 rounded-lg text-slate-400 group-hover:bg-brand/10 group-hover:text-brand transition-colors">
                        <Calendar size={14} />
                      </div>
                      {formatDate(date.date)}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenModal(date); }}
                        className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-xl transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteDate(date.id); }}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                        <Calendar size={32} />
                      </div>
                      <div>
                        <p className="text-slate-900 font-bold">
                          {!activeClient ? 'Selecione um cliente primeiro' : 'Nenhuma data encontrada'}
                        </p>
                        <p className="text-slate-500 text-sm max-w-[200px] mx-auto mt-1">
                          {!activeClient 
                            ? 'Dados não disponíveis para visualização.' 
                            : 'Nenhuma data inserida manualmente para este mês.'}
                        </p>
                      </div>
                      {activeClient && (
                        <button 
                          onClick={() => handleOpenModal()}
                          className="text-brand font-bold text-xs uppercase tracking-widest mt-2 hover:underline"
                        >
                          Adicionar minha primeira data
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DateModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={(data) => {
          if (editingDate) {
            onUpdateDate({ ...editingDate, ...data } as CommemorativeDate);
          } else {
            onAddDate({
              ...data,
              id: generateTempId(),
              type: 'manual'
            } as CommemorativeDate);
          }
          setIsModalOpen(false);
        }}
        date={editingDate}
        categories={categories}
      />
    </div>
  );
}

interface DateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<CommemorativeDate>) => void;
  date: CommemorativeDate | null;
  categories: CommemorativeDateCategory[];
}

function DateModal({ isOpen, onClose, onSave, date, categories }: DateModalProps) {
  const statuses: PostStatus[] = ['Ideia', 'Criando', 'Revisão', 'Enviar para cliente', 'Aprovado', 'Postado', 'Recusado', 'Falha'];
  const [formData, setFormData] = useState<Partial<CommemorativeDate>>(
    date || {
      title: '',
      category: 'Data comemorativa',
      date: format(new Date(), 'yyyy-MM-dd'),
      description: '',
      status: 'Ideia'
    }
  );

  React.useEffect(() => {
    if (date) {
      setFormData(date);
    } else {
      setFormData({
        title: '',
        category: 'Data comemorativa',
        date: format(new Date(), 'yyyy-MM-dd'),
        description: '',
        status: 'Ideia'
      });
    }
  }, [date]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    onSave(formData);
    toast.success(date ? 'Data atualizada!' : 'Data adicionada com sucesso!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="p-10 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{date ? 'Editar Data' : 'Nova Data'}</h2>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Personalização do calendário</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Título da Data*</label>
                  <input 
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand/5 focus:border-brand/30 transition-all font-bold placeholder:text-slate-300"
                    placeholder="Ex: Aniversário da Empresa"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Data*</label>
                    <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[20px] pl-14 pr-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand/5 transition-all font-bold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Categoria</label>
                    <div className="relative">
                      <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text"
                        list="category-suggestions"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-[20px] pl-14 pr-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand/5 transition-all font-bold placeholder:text-slate-300"
                        placeholder="Selecione ou digite..."
                      />
                      <datalist id="category-suggestions">
                        {categories.map(cat => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Status do Projeto</label>
                  <div className="flex flex-wrap gap-2">
                    {statuses.map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setFormData({ ...formData, status })}
                        className={cn(
                          "px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all",
                          formData.status === status 
                            ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10 scale-105" 
                            : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Descrição</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[20px] px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-brand/5 h-28 resize-none transition-all font-medium placeholder:text-slate-300"
                    placeholder="Detalhes sobre esta data especial..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-5 text-sm font-black text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-[24px] transition-all uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-5 bg-slate-900 text-white rounded-[24px] font-black shadow-2xl shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[11px]"
                >
                  <CheckCircle size={20} className="text-brand" />
                  Salvar Data
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
