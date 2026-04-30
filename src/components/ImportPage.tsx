import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Info, Download } from 'lucide-react';
import { Client, Post, TeamMember } from '../types';
import { cn, parseSafeDate, generateTempId } from '../lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

import Papa from 'papaparse';

interface ImportPageProps {
  client: Client;
  team: TeamMember[];
  onImport: (posts: Post[]) => Promise<void>;
}

export function ImportPage({ client, team, onImport }: ImportPageProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file || !file.name.endsWith('.csv')) {
      toast.error('Por favor, envie um arquivo CSV válido.');
      return;
    }

    setIsImporting(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const newPosts: Post[] = [];
          
          // Use utility to parse date safely
          const parseDateImport = (dateStr: string) => {
            const date = parseSafeDate(dateStr);
            if (!date) {
              return format(new Date(), 'yyyy-MM-dd');
            }
            return format(date, 'yyyy-MM-dd');
          };

          // Helper to normalize strings for comparison (remove accents, lowercase, trim)
          const normalize = (str: string) => 
            str.toLowerCase()
               .trim()
               .normalize('NFD')
               .replace(/[\u0300-\u036f]/g, '');

          // Helper to find value by fuzzy header name
          const getValue = (row: any, ...possibleHeaders: string[]) => {
            const rowKeys = Object.keys(row);
            const normalizedPossible = possibleHeaders.map(normalize);
            
            // Try exact matches in order of possibleHeaders
            for (const p of normalizedPossible) {
              for (const key of rowKeys) {
                if (normalize(key) === p) {
                  return row[key];
                }
              }
            }
            
            // Try partial matches in order of possibleHeaders
            for (const p of normalizedPossible) {
              for (const key of rowKeys) {
                const normKey = normalize(key);
                if (normKey.startsWith(p) || p.startsWith(normKey)) {
                  return row[key];
                }
              }
            }
            return undefined;
          };

          // Helper to parse numbers safely
          const parseNum = (val: any) => {
            if (val === undefined || val === null || val === '') return 0;
            // Remove any non-numeric characters except dots or commas
            const cleaned = String(val).replace(/[^\d]/g, '');
            return parseInt(cleaned) || 0;
          };

          results.data.forEach((row: any) => {
            const title = getValue(row, 'titulo', 'title') || 'Post Importado';
            const dateStr = getValue(row, 'data', 'date');
            const status = getValue(row, 'status') || 'Postado';
            const channelsStr = getValue(row, 'canais', 'channels');
            const format = getValue(row, 'formato', 'format') || 'Estático';
            const editorialLineStr = getValue(row, 'linha editorial', 'editorial');
            const description = getValue(row, 'descricao', 'description') || '';
            const responsible = getValue(row, 'responsavel', 'responsible');
            
            const impressions = parseNum(getValue(row, 'impressões', 'impressions', 'visualizações', 'views'));
            const reach = parseNum(getValue(row, 'alcance', 'reach'));
            const plays = parseNum(getValue(row, 'reproducoes', 'reprodução', 'plays'));
            const likes = parseNum(getValue(row, 'likes', 'curtidas', 'curtida'));
            const comments = parseNum(getValue(row, 'comentarios', 'comentário', 'comments', 'comentario'));
            const shares = parseNum(getValue(row, 'compartilhamentos', 'compartilhamen', 'shares', 'compartilhamento'));
            const saves = parseNum(getValue(row, 'salvos', 'saves', 'salvo', 'repost'));

            const editorialItem = client.editorialLine.find(e => 
              e.category.toLowerCase() === (editorialLineStr || '').toLowerCase()
            ) || client.editorialLine[0];

            const responsibleMember = team.find(m => 
              m.name.toLowerCase() === (responsible || '').toLowerCase()
            ) || team[0];

            const post: Post = {
              id: generateTempId(),
              clientId: client.id,
              title,
              date: parseDateImport(dateStr),
              status: (status as any),
              channels: channelsStr ? channelsStr.split(';').map((c: string) => c.trim()) : ['Instagram'],
              format: (format as any),
              editorialItemId: editorialItem?.id || '1',
              description,
              responsible: responsibleMember.name,
              checklist: [],
              comments: [],
              metrics: {
                impressions,
                reach,
                plays,
                likes,
                comments,
                shares,
                saves,
              }
            };
            
            newPosts.push(post);
          });

          if (newPosts.length > 0) {
            await onImport(newPosts);
          } else {
            toast.error('Nenhum dado válido encontrado no CSV.');
          }
        } catch (error) {
          console.error('Erro ao processar CSV:', error);
          toast.error('Erro ao processar o arquivo CSV. Verifique o formato.');
        } finally {
          setIsImporting(false);
        }
      },
      error: (error) => {
        console.error('Erro no PapaParse:', error);
        toast.error('Erro ao ler o arquivo CSV.');
        setIsImporting(false);
      }
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const downloadTemplate = () => {
    const headers = ['Titulo', 'Data', 'Status', 'Canais', 'Formato', 'Linha Editorial', 'Descricao', 'Responsavel', 'Alcance', 'Reproducoes', 'Likes', 'Comentarios', 'Compartilhamentos', 'Salvos'];
    const example = ['Exemplo de Post', '15/04/2026', 'Ideia', 'Instagram;Facebook', 'Estático', client.editorialLine[0]?.category || 'Conteúdo', 'Descrição do post', team[0]?.name || 'Responsável', '1000', '500', '50', '10', '5', '2'];
    
    const csvContent = [headers.join(','), example.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_socialflow.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Importar Dados</h2>
          <p className="text-slate-500">Suba arquivos CSV para incluir posts e métricas automaticamente.</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Download size={18} />
          Baixar Modelo CSV
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-all cursor-pointer min-h-[400px]",
              isDragActive ? "border-indigo-500 bg-indigo-50/50" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50",
              isImporting && "opacity-50 pointer-events-none"
            )}
          >
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mb-6">
              <Upload size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {isDragActive ? "Solte o arquivo aqui" : "Arraste seu CSV ou clique para buscar"}
            </h3>
            <p className="text-slate-500 max-w-sm">
              O sistema processará automaticamente os títulos, datas, canais e métricas de performance.
            </p>
            
            {isImporting && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-3xl">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="font-bold text-slate-900">Processando arquivo...</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex gap-4">
            <div className="text-amber-600 shrink-0">
              <Info size={24} />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 mb-1">Atenção sobre Imagens</h4>
              <p className="text-sm text-amber-800 leading-relaxed">
                Arquivos CSV não suportam o envio de imagens. Após a importação, você deverá acessar cada post individualmente para fazer o upload manual das mídias (fotos ou vídeos).
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-indigo-600" />
              Instruções do CSV
            </h4>
            <ul className="space-y-4">
              {[
                { title: 'Cabeçalhos', desc: 'Use exatamente os nomes do modelo para que o sistema identifique os campos.' },
                { title: 'Formato de Data', desc: 'Use o padrão DD/MM/AAAA (Ex: 15/04/2026).' },
                { title: 'Canais', desc: 'Separe múltiplos canais com ponto e vírgula (Ex: Instagram;Facebook).' },
                { title: 'Métricas', desc: 'Valores numéricos serão somados aos totais do dashboard.' },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              <CheckCircle2 size={18} />
              Pronto para escalar?
            </h4>
            <p className="text-sm text-indigo-100 leading-relaxed">
              A importação em massa é ideal para migrar dados de planilhas antigas ou subir planejamentos mensais inteiros de uma só vez.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
