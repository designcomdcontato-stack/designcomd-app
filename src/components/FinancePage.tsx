import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Download, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  ChevronRight,
  TrendingUp,
  Wallet,
  Building2,
  Filter,
  Search,
  Calculator,
  ChevronLeft
} from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Client, FinancialReport, FinancialItem, AgencySettings } from '../types';
import { cn, generateTempId } from '../lib/utils';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';

interface FinancePageProps {
  activeClient: Client | null;
  reports: FinancialReport[];
  isAdmin: boolean;
  onAddReport: (report: FinancialReport) => void;
  onUpdateReport: (report: FinancialReport) => void;
  onDeleteReport: (id: string) => void;
  agencySettings: AgencySettings;
}

export function FinancePage({ 
  activeClient, 
  reports, 
  isAdmin, 
  onAddReport, 
  onUpdateReport, 
  onDeleteReport,
  agencySettings
}: FinancePageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Date filtering states
  const [viewDate, setViewDate] = useState(new Date());

  // States for new report form
  const [title, setTitle] = useState('');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [dueDate, setDueDate] = useState('');
  const [items, setItems] = useState<FinancialItem[]>([
    { id: '1', description: 'Pacote Básico', value: 0 },
  ]);
  const [observations, setObservations] = useState('');
  const [bank, setBank] = useState('Banco Santander (pix)');
  const [pix, setPix] = useState('400.964.738-86');
  const [beneficiary, setBeneficiary] = useState('David Marcos Jesus da Lapa');
  const [cpfCnpj, setCpfCnpj] = useState('400.964.738-86');

  const clientReports = (reports || []).filter(r => r.clientId === activeClient?.id);
  
  // Filtered reports based on period
  const filteredReports = clientReports.filter(report => {
    const reportDate = parseISO(report.month + '-01');
    return isSameMonth(reportDate, viewDate);
  });

  const handlePrevMonth = () => setViewDate(subMonths(viewDate, 1));
  const handleNextMonth = () => setViewDate(addMonths(viewDate, 1));

  const totalEarnedInPeriod = filteredReports
    .filter(r => r.status === 'Pago')
    .reduce((acc, r) => acc + r.total, 0);

  const totalPendingInPeriod = filteredReports
    .filter(r => r.status === 'Pendente')
    .reduce((acc, r) => acc + r.total, 0);

  const handleAddItem = () => {
    setItems([...items, { id: generateTempId(), description: 'Adicional', value: 0 }]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleUpdateItem = (id: string, field: keyof FinancialItem, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const calculateTotal = (reportItems: FinancialItem[]) => {
    return reportItems.reduce((acc, item) => acc + (Number(item.value) || 0), 0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClient) return;

    const total = calculateTotal(items);
    const newReport: FinancialReport = {
      id: selectedReport?.id || generateTempId(),
      clientId: activeClient.id,
      month,
      title: title || `Fechamento ${format(parseISO(month + '-01'), 'MMMM yyyy', { locale: ptBR })}`,
      dueDate,
      items,
      status: selectedReport?.status || 'Pendente',
      total,
      observations,
      createdAt: new Date().toISOString(),
      paymentInfo: {
        bank,
        pix,
        cpfCnpj,
        beneficiary
      }
    };

    if (selectedReport) {
      onUpdateReport(newReport);
      toast.success('Relatório atualizado com sucesso!');
    } else {
      onAddReport(newReport);
      toast.success('Relatório criado com sucesso!');
    }

    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedReport(null);
    setTitle('');
    setMonth(format(new Date(), 'yyyy-MM'));
    setDueDate('');
    setObservations('');
    setItems([{ id: '1', description: 'Pacote Básico', value: 0 }]);
  };

  const handleEdit = (report: FinancialReport) => {
    setSelectedReport(report);
    setTitle(report.title);
    setMonth(report.month);
    setDueDate(report.dueDate);
    setObservations(report.observations || '');
    setItems(report.items);
    setBank(report.paymentInfo.bank);
    setPix(report.paymentInfo.pix);
    setBeneficiary(report.paymentInfo.beneficiary);
    setCpfCnpj(report.paymentInfo.cpfCnpj);
    setIsModalOpen(true);
  };

  const handleDownload = async () => {
    if (reportRef.current === null) return;
    
    const toastId = toast.loading('Gerando imagem para download...');
    
    try {
      const dataUrl = await toPng(reportRef.current, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `relatorio-${selectedReport?.title || 'financeiro'}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Download concluído!', { id: toastId });
    } catch (err) {
      console.error('oops, something went wrong!', err);
      toast.error('Erro ao gerar download.', { id: toastId });
    }
  };

  const themeColor = agencySettings?.primaryColor || '#7a1c43';
  const themeColorLight = `${themeColor}1a`; // 10% opacity

  if (!activeClient) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Financeiro</h1>
          <p className="text-slate-500">Gestão de fechamentos e orçamentos para {activeClient.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
            <button 
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold px-4 min-w-[140px] text-center capitalize">
              {format(viewDate, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button 
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={() => { resetForm(); setIsModalOpen(true); }}
              className="flex items-center justify-center gap-2 bg-brand text-white px-4 py-2 rounded-lg font-medium hover:bg-brand/90 transition-all shadow-sm shadow-brand/20"
            >
              <Plus size={18} />
              Novo Fechamento
            </button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Calculator size={20} />
            </div>
            <span className="text-sm font-medium text-slate-600">Pendente no Período</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalPendingInPeriod)}
            </p>
            <TrendingUp size={16} className="text-slate-400" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-sm font-medium text-slate-600">Total Recebido no Período</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-slate-900">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalEarnedInPeriod)}
            </p>
            <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded uppercase">
              Ganhos
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-slate-50 text-slate-600 rounded-lg">
              <FileText size={20} />
            </div>
            <span className="text-sm font-medium text-slate-600">Relatórios no Período</span>
          </div>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-slate-900">{filteredReports.length}</p>
            <FileText size={16} className="text-slate-400" />
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Relatório</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Valor Total</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Nenhum registro financeiro encontrado para o período selecionado.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 text-slate-500 rounded-lg">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{report.title}</p>
                          <p className="text-xs text-slate-500">Ref: {format(parseISO(report.month + '-01'), 'MMMM yyyy', { locale: ptBR })}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={14} />
                        {report.dueDate ? format(parseISO(report.dueDate), 'dd/MM/yyyy') : 'Não definida'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(report.total)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          if (!isAdmin) return;
                          const nextStatus: any = report.status === 'Pendente' ? 'Pago' : report.status === 'Pago' ? 'Atrasado' : 'Pendente';
                          onUpdateReport({ ...report, status: nextStatus });
                        }}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
                          report.status === 'Pago' ? "bg-green-100 text-green-700" :
                          report.status === 'Atrasado' ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700",
                          isAdmin && "hover:opacity-80 cursor-pointer"
                        )}
                      >
                        {report.status === 'Pago' && <CheckCircle2 size={12} />}
                        {report.status === 'Atrasado' && <AlertCircle size={12} />}
                        {report.status === 'Pendente' && <Clock size={12} />}
                        {report.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedReport(report); setIsPreviewOpen(true); }}
                          title="Fazer Download"
                          className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                        >
                          <Download size={18} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleEdit(report)}
                              title="Editar"
                              className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            >
                              <Search size={18} />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Excluir este relatório?')) {
                                  onDeleteReport(report.id);
                                }
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 sticky top-0 bg-white z-10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {selectedReport ? 'Editar Fechamento' : 'Novo Fechamento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <Trash2 size={20} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Título do Relatório</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Fechamento Mensal"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Mês de Referência</label>
                  <input
                    type="month"
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Data de Vencimento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Status</label>
                  <select 
                    value={selectedReport?.status || 'Pendente'}
                    onChange={(e) => {
                      if (selectedReport) setSelectedReport({ ...selectedReport, status: e.target.value as any });
                    }}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Pago">Pago</option>
                    <option value="Atrasado">Atrasado</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Observações</label>
                  <textarea
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Ex: Pagamento referente à gestão de tráfego e social media."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none min-h-[80px]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Itens do Serviço</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-brand hover:text-brand/80 text-sm font-medium flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Adicionar Item
                  </button>
                </div>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 items-end">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                          placeholder="Descrição do serviço"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                        />
                      </div>
                      <div className="w-32 space-y-1">
                        <input
                          type="number"
                          value={item.value}
                          onChange={(e) => handleUpdateItem(item.id, 'value', e.target.value)}
                          placeholder="0,00"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-brand/5 border border-brand/10 rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-brand uppercase tracking-wider">Dados para Pagamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Banco/Tipo</label>
                    <input
                      type="text"
                      value={bank}
                      onChange={(e) => setBank(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Chave PIX</label>
                    <input
                      type="text"
                      value={pix}
                      onChange={(e) => setPix(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">CPF/CNPJ</label>
                    <input
                      type="text"
                      value={cpfCnpj}
                      onChange={(e) => setCpfCnpj(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Beneficiário</label>
                    <input
                      type="text"
                      value={beneficiary}
                      onChange={(e) => setBeneficiary(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 border border-slate-200 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-all font-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-all shadow-sm shadow-brand/20 font-sans"
                >
                  {selectedReport ? 'Salvar Alterações' : 'Criar Fechamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal for Download only */}
      {isPreviewOpen && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 px-6">
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-6 py-2 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-all shadow-sm shadow-brand/20"
                >
                  <Download size={18} />
                  Download do Relatório
                </button>
                <p className="text-xs text-slate-500 hidden sm:block italic">
                  O relatório será baixado como imagem para envio fácil.
                </p>
              </div>
              <button 
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <ChevronRight size={24} className="rotate-180" />
              </button>
            </div>

            {/* Document Area */}
            <div className="p-6 overflow-x-auto bg-slate-50">
              <div 
                ref={reportRef} 
                className="bg-white p-12 font-sans w-[700px] mx-auto shadow-xl relative overflow-hidden"
                style={{ minHeight: '900px', color: themeColor }}
              >
                {/* Decorative Elements */}
                <div 
                  className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full" 
                  style={{ backgroundColor: themeColorLight }}
                />
                <div 
                  className="absolute bottom-0 left-0 w-64 h-64 -ml-32 -mb-32 rounded-full" 
                  style={{ backgroundColor: themeColorLight }}
                />

                {/* Document Header */}
                <div className="relative flex justify-between items-start mb-20">
                  <div className="space-y-6">
                    {agencySettings.logo ? (
                      <img src={agencySettings.logo} alt="Logo" className="w-24 h-24 object-contain" />
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg" 
                        style={{ backgroundColor: themeColor, boxShadow: `0 10px 15px -3px ${themeColor}4d` }}
                      >
                        {agencySettings.name?.[0] || 'D'}
                      </div>
                    )}
                    <div className="text-[10px] uppercase tracking-[0.3em] font-black [writing-mode:vertical-lr] opacity-40 absolute -left-8 top-0">
                      {agencySettings.name || 'DESIGN COM'}
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 
                      className="text-2xl font-black uppercase tracking-widest mb-2 border-b-2 inline-block pb-1"
                      style={{ borderBottomColor: themeColor }}
                    >
                      {selectedReport.title || `ORÇAMENTO DE ${format(parseISO(selectedReport.month + '-01'), 'MMM yyyy', { locale: ptBR }).toUpperCase()}`}
                    </h2>
                    <p className="text-sm font-bold tracking-tight opacity-80">Empresa: {activeClient.name}</p>
                  </div>
                </div>

                {/* Items List */}
                <div className="relative space-y-10 mb-20 px-2 min-h-[300px]">
                  {selectedReport.items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex justify-between items-end border-b pb-3"
                      style={{ borderBottomColor: `${themeColor}1a` }}
                    >
                      <span className="text-xl font-medium tracking-tight">{item.description}</span>
                      <div className="text-right flex items-baseline gap-1">
                        <span className="text-[14px] font-bold opacity-60">R$</span>
                        <span className="text-xl font-black">
                          {item.value > 0 ? new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(item.value) : '-'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div 
                  className="relative flex justify-between items-center mb-10 p-8 rounded-2xl border-l-8"
                  style={{ backgroundColor: themeColorLight, borderLeftColor: themeColor }}
                >
                  <span className="text-2xl font-black uppercase tracking-[0.2em]">Serviços Realizados |</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold opacity-60">R$</span>
                    <span className="text-4xl font-black">
                      {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(selectedReport.total)}
                    </span>
                  </div>
                </div>

                <div className="relative mb-6 px-2 text-lg italic font-black opacity-80">
                  Vencimento: {format(parseISO(selectedReport.dueDate), 'dd/MM/yy')}
                </div>

                {selectedReport.observations && (
                  <div className="relative mb-16 px-2">
                    <h4 className="text-xs font-black uppercase tracking-widest opacity-40 mb-2">Observações:</h4>
                    <p className="text-md font-bold leading-relaxed opacity-80 whitespace-pre-wrap">
                      {selectedReport.observations}
                    </p>
                  </div>
                )}

                {/* Footer / Payment Info */}
                <div 
                  className="relative border-t-2 pt-10 px-2 grid grid-cols-1 gap-6"
                  style={{ borderTopColor: themeColor }}
                >
                  <div className="space-y-4">
                    <h4 className="text-xl font-black uppercase tracking-wider">Dados para pagamento:</h4>
                    <div className="space-y-2 text-md font-bold opacity-90 leading-relaxed">
                      <p 
                        className="p-2 rounded-lg inline-block mr-4"
                        style={{ backgroundColor: themeColorLight }}
                      >
                        {selectedReport.paymentInfo.bank}
                      </p>
                      <p>CPF: <span className="font-black">{selectedReport.paymentInfo.cpfCnpj}</span></p>
                      <p className="font-black text-lg">{selectedReport.paymentInfo.beneficiary}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
