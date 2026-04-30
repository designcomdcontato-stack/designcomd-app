import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell,
  LabelList,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark,
  Filter,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Facebook,
  Instagram
} from 'lucide-react';
import { Client, Post, AgencySettings } from '../types';
import { cn, formatDate, parseSafeDate } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as htmlToImage from 'html-to-image';
import { toast } from 'sonner';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  isWithinInterval, 
  addMonths, 
  subMonths,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MetricsPageProps {
  client: Client;
  posts: Post[];
  agencySettings: AgencySettings;
}

export function MetricsPage({ client, posts, agencySettings }: MetricsPageProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  const allClientPosts = posts.filter(p => p.clientId === client.id && p.status === 'Postado');
  
  const clientPosts = allClientPosts.filter(p => {
    const postDate = parseSafeDate(p.date);
    if (!postDate) return false;
    if (viewMode === 'month') {
      return isWithinInterval(postDate, {
        start: startOfMonth(selectedDate),
        end: endOfMonth(selectedDate)
      });
    } else {
      return isWithinInterval(postDate, {
        start: startOfYear(selectedDate),
        end: endOfMonth(selectedDate) // Up to the selected month
      });
    }
  });
  
  const historySorted = [...(client.followerHistory || [])].sort((a, b) => a.date.localeCompare(b.date));
  const latestFollowers = (historySorted.length > 0) ? (historySorted[historySorted.length - 1]?.count || 0) : 0;

  const findLastFollowerCount = (date: string) => {
    if (!historySorted || historySorted.length === 0) return latestFollowers;
    for (let i = historySorted.length - 1; i >= 0; i--) {
      if (historySorted[i].date <= date) return historySorted[i].count;
    }
    return latestFollowers;
  };

  const calculatePostRate = (p: Post) => {
    const interactions = (p.metrics?.impressions || 0) + (p.metrics?.reach || 0) + (p.metrics?.plays || 0) + (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0) + (p.metrics?.saves || 0);
    // Use the follower count at the time of the post if possible, or the latest
    const followersAtTime = findLastFollowerCount(p.date);
    return followersAtTime > 0 ? (interactions / followersAtTime) * 10 : 0;
  };

  const clientPostsWithRate = clientPosts.map(p => {
    const rate = calculatePostRate(p);
    const editorial = (client.editorialLine || []).find(e => e.id === p.editorialItemId);
    return {
      ...p,
      rate,
      objective: editorial?.objective || 'Impacto'
    };
  });

  const totals = clientPosts.reduce((acc, p) => ({
    impressions: acc.impressions + (p.metrics?.impressions || 0),
    reach: acc.reach + (p.metrics?.reach || 0),
    plays: acc.plays + (p.metrics?.plays || 0),
    likes: acc.likes + (p.metrics?.likes || 0),
    comments: acc.comments + (p.metrics?.comments || 0),
    shares: acc.shares + (p.metrics?.shares || 0),
    saves: acc.saves + (p.metrics?.saves || 0),
  }), { impressions: 0, reach: 0, plays: 0, likes: 0, comments: 0, shares: 0, saves: 0 });

  const totalEngagement = totals.impressions + totals.reach + totals.plays + totals.likes + totals.comments + totals.shares + totals.saves;
  const engagementRate = latestFollowers > 0 ? (totalEngagement / latestFollowers) * 10 : 0;

  const topPosts = [...clientPostsWithRate]
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 5);

  // Calculate monthly engagement rate for ALL time
  const monthlyEngagement = allClientPosts.reduce((acc: Record<string, { interactions: number; postCount: number }>, p) => {
    const month = p.date.substring(0, 7); // YYYY-MM
    if (!acc[month]) acc[month] = { interactions: 0, postCount: 0 };
    acc[month].interactions += (p.metrics?.impressions || 0) + (p.metrics?.reach || 0) + (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0) + (p.metrics?.saves || 0) + (p.metrics?.plays || 0);
    acc[month].postCount += 1;
    return acc;
  }, {});

  const engagementHistory = Object.entries(monthlyEngagement)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, data]) => {
      let followersAtMonth = latestFollowers;
      for (let i = historySorted.length - 1; i >= 0; i--) {
        if (historySorted[i].date.startsWith(month) || historySorted[i].date < month) {
          followersAtMonth = historySorted[i].count;
          break;
        }
      }
      const rate = followersAtMonth > 0 ? (data.interactions / (followersAtMonth * (data.postCount || 1))) * 10 : 0;
      return {
        month: formatDate(month, { month: 'short', year: '2-digit' }),
        rate
      };
    });

  // Group follower history by month (take the last entry of each month)
  const monthlyFollowers = historySorted.reduce((acc: Record<string, number>, h) => {
    const month = h.date.substring(0, 7);
    acc[month] = h.count;
    return acc;
  }, {});

  const followerHistoryData = Object.entries(monthlyFollowers)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, count]) => ({
      month: formatDate(month, { month: 'short', year: '2-digit' }),
      count
    }));

  // Calculate channel distribution
  const channelCounts = clientPosts.reduce((acc: Record<string, number>, p) => {
    (p.channels || []).forEach(channel => {
      acc[channel] = (acc[channel] || 0) + 1;
    });
    return acc;
  }, {});

  const channelData = Object.entries(channelCounts).map(([name, value]) => ({ name, value }));

  // Calculate format distribution
  const formatCounts = clientPosts.reduce((acc: Record<string, number>, p) => {
    acc[p.format] = (acc[p.format] || 0) + 1;
    return acc;
  }, {});

  const formatData = Object.entries(formatCounts).map(([name, value]) => ({ name, value }));

  // Calculate editorial distribution
  const editorialCounts = clientPosts.reduce((acc: Record<string, number>, p) => {
    const editorial = (client.editorialLine || []).find(e => e.id === p.editorialItemId);
    const name = editorial?.category || 'Outros';
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  const editorialData = Object.entries(editorialCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const brandColor = agencySettings.primaryColor || '#4f46e5';
  const secondaryColor = agencySettings.secondaryColor || '#818cf8';
  const tertiaryColor = agencySettings.tertiaryColor || '#c7d2fe';
  const COLORS = [brandColor, secondaryColor, tertiaryColor, '#312e81', '#4338ca', '#6366f1'];

  const TikTokIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
  );

  const getEngagementLabel = (rate: number) => {
    if (rate <= 1) return { label: 'Ruim', color: 'bg-red-500', ref: '1%' };
    if (rate <= 5) return { label: 'Bom', color: 'bg-blue-500', ref: '5%' };
    if (rate <= 10) return { label: 'Ideal', color: 'bg-emerald-500', ref: '10%' };
    if (rate <= 15) return { label: 'Muito Bom', color: 'bg-brand', ref: '15%' };
    return { label: 'Excelente', color: 'bg-purple-600', ref: '>15%' };
  };

  let growthRate = 0;
  let hasGrowthData = false;
  if (historySorted.length >= 2) {
    const current = historySorted[historySorted.length - 1].count;
    const previous = historySorted[historySorted.length - 2].count;
    growthRate = ((current - previous) / previous) * 100;
    hasGrowthData = true;
  }

  // Calculate Reach Growth
  const reachHistory = Object.entries(monthlyEngagement)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, _]) => {
      // Re-calculate reach for all posts in that month
      return allClientPosts
        .filter(p => p.date.startsWith(month))
        .reduce((sum, p) => sum + (p.metrics?.reach || 0), 0);
    });
  
  let reachGrowthRate = 0;
  let hasReachGrowthData = false;
  if (reachHistory.length >= 2) {
    const current = reachHistory[reachHistory.length - 1];
    const previous = reachHistory[reachHistory.length - 2];
    if (previous > 0) {
      reachGrowthRate = ((current - previous) / previous) * 100;
      hasReachGrowthData = true;
    }
  }

  const engagementStatus = getEngagementLabel(engagementRate);

  const renderCustomizedLabel = ({ name, value, percent }: any) => {
    return `${name}: ${value} (${(percent * 100).toFixed(0)}%)`;
  };

  const handleExportPDF = async () => {
    const toastId = toast.loading('Gerando relatório de alta qualidade...');
    
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const date = new Date().toLocaleDateString('pt-BR');

      // Helper to load image
      const getImageData = (url: string): Promise<string> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
          };
          img.onerror = reject;
          img.src = url;
        });
      };

      // Helper to convert hex to RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16)
        ] : [79, 70, 229];
      };

      const brandRgb = hexToRgb(brandColor);

      // Header & Logo
      try {
        if (client.logo) {
          const logoData = await getImageData(client.logo);
          // Draw a stylish border around the logo
          doc.setDrawColor(brandRgb[0], brandRgb[1], brandRgb[2]);
          doc.setLineWidth(2);
          doc.rect(159, 9, 37, 37);
          
          doc.addImage(logoData, 'PNG', 160, 10, 35, 35, undefined, 'FAST');
        }
      } catch (e) {
        console.warn('Could not load client logo for PDF', e);
      }

      doc.setFontSize(24);
      doc.setTextColor(brandRgb[0], brandRgb[1], brandRgb[2]);
      doc.text('Relatório de Performance', 14, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      const periodText = viewMode === 'month' 
        ? format(selectedDate, 'MMMM yyyy', { locale: ptBR })
        : `Acumulado até ${format(selectedDate, 'MMMM yyyy', { locale: ptBR })}`;
      doc.text(`Período: ${periodText} | Gerado em: ${date}`, 14, 33);

      // Client Info Section
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('Dados do Cliente', 14, 50);
      
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // slate-700
      doc.text(`Cliente: ${client.name}`, 14, 58);
      doc.text(`Responsável: ${client.responsible}`, 14, 64);
      doc.text(`Canais: ${(client.socialMedia || []).join(', ')}`, 14, 70);
      if (client.observations) {
        doc.text(`Foco: ${client.observations}`, 14, 76);
      }

      // Calculate Growth Rate
      const history = client.followerHistory || [];
      let growthRateText = 'N/A';
      if (history.length >= 2) {
        const current = history[history.length - 1].count;
        const previous = history[history.length - 2].count;
        const growth = ((current - previous) / previous) * 100;
        growthRateText = `${growth >= 0 ? '+' : ''}${growth.toFixed(2).replace('.', ',')}%`;
      }

      // Calculate Reach Growth
      const reachHistoryArr = Object.keys(monthlyEngagement)
        .sort((a, b) => a.localeCompare(b))
        .map(month => {
          return allClientPosts
            .filter(p => p.date.startsWith(month))
            .reduce((sum, p) => sum + (p.metrics?.reach || 0), 0);
        });
      
      let reachGrowthText = 'N/A';
      if (reachHistoryArr.length >= 2) {
        const current = reachHistoryArr[reachHistoryArr.length - 1];
        const previous = reachHistoryArr[reachHistoryArr.length - 2];
        if (previous > 0) {
          const growth = ((current - previous) / previous) * 100;
          reachGrowthText = `${growth >= 0 ? '+' : ''}${growth.toFixed(2).replace('.', ',')}%`;
        }
      }

      // Summary Metrics Table
      autoTable(doc, {
        startY: 85,
        head: [['Métrica Principal', 'Resultado']],
        body: [
          ['Seguidores Atuais', ((client.followerHistory || [])[(client.followerHistory || []).length - 1]?.count || 0).toLocaleString()],
          ['Crescimento de Seguidores (Mensal)', growthRateText],
          ['Engajamento Total', totalEngagement.toLocaleString()],
          ['Taxa de Engajamento', `${engagementRate.toFixed(2).replace('.', ',')}%`],
          ['Status da Performance', engagementStatus.label.toUpperCase()],
          ['Alcance Total', totals.reach.toLocaleString()],
          ['Crescimento de Alcance (Mensal)', reachGrowthText],
          ['Reproduções de Vídeo', totals.plays.toLocaleString()],
          ['Total de Likes', totals.likes.toLocaleString()],
          ['Total de Comentários', totals.comments.toLocaleString()],
          ['Total de Compartilhamentos', totals.shares.toLocaleString()],
          ['Total de Salvos', totals.saves.toLocaleString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: brandRgb as any, fontSize: 11, halign: 'center' },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 14, right: 14 }
      });

      // Top Posts Table
      let finalY = (doc as any).lastAutoTable.finalY || 85;
      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Top 5 - Conteúdos de Maior Impacto', 14, finalY + 15);

      autoTable(doc, {
        startY: finalY + 20,
        head: [['Título do Conteúdo', 'Linha Editorial', 'Engajamento']],
        body: topPosts.map(p => [
          p.title,
          p.objective,
          `${p.rate.toFixed(2).replace('.', ',')}%`
        ]),
        theme: 'grid',
        headStyles: { fillColor: brandRgb as any, fontSize: 10 },
        columnStyles: { 2: { halign: 'right', fontStyle: 'bold', textColor: brandRgb as any } },
        margin: { left: 14, right: 14 }
      });

      // PAGE 2: Full Publication Calendar
      doc.addPage();

      // Second Page Header
      doc.setFontSize(22);
      doc.setTextColor(brandRgb[0], brandRgb[1], brandRgb[2]);
      doc.text('Calendário de Publicações', 14, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Registro detalhado de todos os conteúdos publicados em ${periodText}`, 14, 33);

      const calendarPostsData = clientPosts
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(p => {
          const dateObj = parseSafeDate(p.date);
          const formattedDate = dateObj ? format(dateObj, 'dd/MM (EEEE)', { locale: ptBR }) : p.date;
          return [
            formattedDate,
            p.title,
            p.format,
            p.channels.join(', ')
          ];
        });

      autoTable(doc, {
        startY: 45,
        head: [['Data', 'Título do Conteúdo', 'Formato', 'Canais']],
        body: calendarPostsData,
        theme: 'striped',
        headStyles: { fillColor: brandRgb as any, fontSize: 10, halign: 'center' },
        columnStyles: { 
          0: { cellWidth: 35, fontStyle: 'bold', halign: 'center' },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 40 }
        },
        styles: { fontSize: 9, cellPadding: 4 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        margin: { left: 14, right: 14 },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 0) {
            data.cell.styles.textColor = brandRgb as any;
          }
        }
      });

      // Add detailed summary footer
      let lastY = (doc as any).lastAutoTable.finalY || 45;
      
      // Check if we need a new page for the summary (ensure at least 40mm space)
      if (lastY > 250) {
        doc.addPage();
        lastY = 20;
      }

      const footerY = lastY + 20;

      // Draw a separator line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.line(14, footerY - 5, 196, footerY - 5);

      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo de Produção do Período', 14, footerY);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85); // slate-700
      
      const summaryCols = [
        { label: 'Total de Posts:', value: clientPosts.length.toString() },
        { label: 'Reels:', value: (formatCounts['Reels'] || 0).toString() },
        { label: 'Estáticos:', value: (formatCounts['Estático'] || 0).toString() },
        { label: 'Carrosséis:', value: (formatCounts['Carrossel'] || 0).toString() }
      ];

      let currentX = 14;
      summaryCols.forEach(col => {
        doc.setFont('helvetica', 'bold');
        doc.text(col.label, currentX, footerY + 10);
        const labelWidth = doc.getTextWidth(col.label);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(brandRgb[0], brandRgb[1], brandRgb[2]);
        doc.text(col.value, currentX + labelWidth + 2, footerY + 10);
        doc.setTextColor(51, 65, 85);
        
        currentX += labelWidth + 25;
      });

      // Add additional formats if they exist (Stories, Videos)
      const otherFormats = Object.entries(formatCounts)
        .filter(([f]) => !['Reels', 'Estático', 'Carrossel'].includes(f))
        .map(([f, count]) => `${f}: ${count}`)
        .join(' | ');

      if (otherFormats) {
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // slate-500
        doc.text(`Outros formatos - ${otherFormats}`, 14, footerY + 18);
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      
      // Agency Footer in PDF
      if (agencySettings.logo) {
        try {
          const agencyLogoData = await getImageData(agencySettings.logo);
          doc.addImage(agencyLogoData, 'PNG', 14, doc.internal.pageSize.getHeight() - 15, 8, 8);
        } catch (e) {}
      }
      doc.text(
        `Gerado por: ${agencySettings.name} | SocialFlow - Relatório Estratégico - ${client.name}`,
        agencySettings.logo ? 25 : 14,
        doc.internal.pageSize.getHeight() - 10
      );

      doc.save(`relatorio-performance-${client.name.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success('Relatório PDF gerado com sucesso!', { id: toastId });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar o relatório PDF.', { id: toastId });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Métricas Detalhadas</h1>
          <p className="text-slate-500 text-sm">Análise de performance de {client.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setViewMode('month')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'month' ? "bg-brand/10 text-brand" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Mês
            </button>
            <button 
              onClick={() => setViewMode('year')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === 'year' ? "bg-brand/10 text-brand" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              Acumulado (Ano)
            </button>
          </div>

          <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
              className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-bold px-4 min-w-[120px] text-center">
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
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-xl text-sm font-bold shadow-lg shadow-brand/10 hover:opacity-90 transition-all"
          >
            <Download size={16} />
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-50 rounded-lg">
              <Heart className="text-pink-600" size={20} />
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Engajamento</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{totalEngagement.toLocaleString()}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand/10 rounded-lg">
              <TrendingUp className="text-brand" size={20} />
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Taxa</p>
          </div>
          <div className="flex items-baseline gap-1">
            <p className="text-3xl font-bold text-slate-900">{engagementRate.toFixed(2).replace('.', ',')}</p>
            <p className="text-xl font-bold text-slate-400">%</p>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className={cn("px-2 py-0.5 text-white text-[10px] font-bold rounded uppercase", engagementStatus.color)}>
              {engagementStatus.label}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="text-blue-600" size={20} />
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Seguidores</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            {latestFollowers.toLocaleString()}
          </p>
          {hasGrowthData && (
            <div className="mt-2 flex items-center gap-2">
              <span className={cn(
                "px-2 py-0.5 text-[10px] font-bold rounded uppercase",
                growthRate >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
              )}>
                {growthRate >= 0 ? '+' : ''}{growthRate.toFixed(1).replace('.', ',')}%
              </span>
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Crescimento</span>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Alcance', value: totals.reach, color: 'bg-slate-900', growth: hasReachGrowthData ? reachGrowthRate : null },
          { label: 'Reprodução', value: totals.plays, color: 'bg-red-700' },
          { label: 'Like', value: totals.likes, color: 'bg-pink-400' },
          { label: 'Comentário', value: totals.comments, color: 'bg-slate-900' },
          { label: 'Compartilhamento', value: totals.shares, color: 'bg-red-700' },
          { label: 'Salvo/Repost', value: totals.saves, color: 'bg-pink-400' },
        ].map((m, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <p className="text-lg font-bold text-slate-900">{m.value.toLocaleString()}</p>
              {m.growth !== undefined && m.growth !== null && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${m.growth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {m.growth >= 0 ? '+' : ''}{m.growth.toFixed(1).replace('.', ',')}%
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-tight">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top 5 Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-bottom border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Top 5 - Melhores Posts</h3>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Performance por Engajamento</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                  <th className="px-6 py-4">Título do Post</th>
                  <th className="px-6 py-4 text-center">Objetivo</th>
                  <th className="px-6 py-4 text-right">Taxa de Engajamento</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                {topPosts.map((post, i) => (
                  <tr key={post.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-300 w-4">0{i + 1}</span>
                        <span className="font-medium text-slate-900">{post.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
                        {post.objective}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-brand">
                      {post.rate.toFixed(2).replace('.', ',')}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Monthly Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900">Seguidores por Mês</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand" />
              <span className="text-xs font-medium text-slate-500 uppercase">Crescimento</span>
            </div>
          </div>
          <div className="min-h-[300px] h-[300px] w-full" style={{ minWidth: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={followerHistoryData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                />
                <Line type="monotone" dataKey="count" stroke={brandColor} strokeWidth={4} dot={{ r: 4, fill: brandColor, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }}>
                  <LabelList dataKey="count" position="top" offset={10} style={{ fontSize: '10px', fill: brandColor, fontWeight: 'bold' }} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900">Taxa de Engajamento por Mês</h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-400" />
              <span className="text-xs font-medium text-slate-500 uppercase">Performance</span>
            </div>
          </div>
          <div className="min-h-[300px] h-[300px] w-full" style={{ minWidth: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementHistory} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value.toFixed(2)}%`, 'Taxa']}
                />
                <Bar dataKey="rate" fill={secondaryColor} radius={[6, 6, 0, 0]} barSize={40}>
                  <LabelList 
                    dataKey="rate" 
                    position="top" 
                    offset={10} 
                    formatter={(val: number) => `${val.toFixed(1)}%`}
                    style={{ fontSize: '10px', fill: secondaryColor, fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distribution Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-8">Distribuição por Canal</h3>
          <div className="h-auto lg:h-[300px] w-full flex flex-wrap items-center justify-center gap-8 md:gap-12 py-8 px-4">
            {channelData.length === 0 ? (
              <div className="text-slate-400 text-sm italic">Nenhum dado disponível</div>
            ) : (
              channelData.map((channel, index) => {
                const total = channelData.reduce((acc, curr) => acc + curr.value, 0);
                const percentage = ((channel.value / total) * 100).toFixed(0);
                
                // Create variants for backgrounds
                const bgVariant = index === 0 ? brandColor : 
                                 index === 1 ? `${brandColor}dd` : 
                                 `${brandColor}bb`;
                
                return (
                  <div key={channel.name} className="flex flex-col items-center gap-4 group">
                    <div 
                      className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] flex items-center justify-center text-white shadow-xl transition-transform group-hover:scale-110 duration-300"
                      style={{ 
                        backgroundColor: bgVariant,
                        boxShadow: `0 20px 25px -5px ${brandColor}33`
                      }}
                    >
                      {channel.name === 'Facebook' && <Facebook size={40} fill="currentColor" />}
                      {channel.name === 'Instagram' && <Instagram size={40} />}
                      {channel.name === 'TikTok' && <TikTokIcon size={40} className="text-white" />}
                      {!['Facebook', 'Instagram', 'TikTok'].includes(channel.name) && <Users size={40} />}
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-800">{channel.name}</p>
                      <p 
                        className="text-sm font-bold opacity-60 transition-opacity group-hover:opacity-100"
                        style={{ color: brandColor }}
                      >
                        {channel.value} <span className="text-xs font-medium ml-0.5">({percentage}%)</span>
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-8">Distribuição por Formato</h3>
          <div className="h-auto lg:h-[300px] w-full flex flex-col justify-center gap-6 py-8 px-4 md:px-12">
            {formatData.length === 0 ? (
              <div className="text-slate-400 text-sm italic text-center">Nenhum dado disponível</div>
            ) : (
              formatData.map((item, index) => {
                const total = formatData.reduce((acc, curr) => acc + curr.value, 0);
                const percentage = ((item.value / total) * 100).toFixed(0);
                // Create variants based on brand color
                const colorVariant = index === 0 ? brandColor : `${brandColor}dd`;
                
                return (
                  <div key={item.name} className="flex items-center justify-between group">
                    <div 
                      className="px-6 py-3 md:px-8 md:py-3 rounded-2xl text-white font-bold text-lg md:text-2xl min-w-[140px] md:min-w-[180px] text-center shadow-lg transition-all group-hover:px-10"
                      style={{ backgroundColor: colorVariant }}
                    >
                      {item.name}
                    </div>
                    <div className="text-right flex items-baseline gap-2">
                      <span 
                        className="text-2xl md:text-3xl font-black opacity-80 group-hover:opacity-100 transition-opacity"
                        style={{ color: brandColor }}
                      >
                        {item.value}
                      </span>
                      <span 
                        className="text-lg md:text-xl font-bold opacity-40 group-hover:opacity-60 transition-opacity"
                        style={{ color: brandColor }}
                      >
                        ({percentage}%)
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Editorial Line Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-8">Postagens por Linha Editorial</h3>
        <div className="min-h-[400px] h-[400px] w-full" id="chart-editorial" style={{ minWidth: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={editorialData}
              layout="vertical"
              margin={{ left: 40, right: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 12, fill: '#64748b', fontWeight: 'medium'}}
                width={150}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Bar dataKey="value" fill={brandColor} radius={[0, 4, 4, 0]} barSize={32}>
                <LabelList 
                  dataKey="value" 
                  position="right" 
                  offset={10} 
                  style={{ fontSize: '12px', fill: brandColor, fontWeight: 'bold' }} 
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

