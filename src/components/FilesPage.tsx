import React, { useState, useRef, useEffect } from 'react';
import { 
  FolderOpen, 
  File, 
  Plus, 
  Search, 
  MoreVertical, 
  Trash2, 
  Edit2, 
  Download, 
  Upload,
  Palette,
  Mic2,
  Video,
  Type,
  ArrowLeft,
  X,
  PlusCircle,
  Copy,
  Check,
  Eye,
  ShieldCheck,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { Client, BrandAsset, Folder, BrandColor, FixedInfoItem, BrandVoice } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { supabaseService } from '../services/supabaseService';

const getAssetPublicUrl = (asset: BrandAsset) => {
  if (!asset) return '';
  
  // 1. No console, mostrar para cada arquivo
  console.log(`[FILE DEBUG] ${asset.name}:`, {
    name: asset.name,
    url: asset.url,
    path: asset.path,
    publicUrl: asset.publicUrl
  });

  let publicUrl = '';
  
  // 1. se public_url existir, usar public_url (User Rule)
  if (asset.publicUrl && asset.publicUrl.startsWith('http')) {
    publicUrl = asset.publicUrl;
  }
  // 2. se não, gerar com getPublicUrl(path) (User Rule)
  else if (asset.path) {
    const { data } = supabase.storage.from("files").getPublicUrl(asset.path);
    publicUrl = data.publicUrl;
  }
  // Fallback para URL pública no campo url
  else if (asset.url && asset.url.startsWith('http')) {
    publicUrl = asset.url;
  }
  // Fallback para getPublicUrl(url) se url for um path
  else if (asset.url && !asset.url.startsWith('blob:')) {
    const { data } = supabase.storage.from("files").getPublicUrl(asset.url);
    publicUrl = data.publicUrl;
  }
  // Preview local temporário
  else if (asset.url && asset.url.startsWith('blob:')) {
    publicUrl = asset.url;
  }

  // 5. Arquivos antigos sem path/public_url devem mostrar placeholder (User Rule)
  // handled in render logic below if publicUrl is empty

  console.log(`[FILE DEBUG] Final publicUrl for ${asset.name}:`, publicUrl);
  return publicUrl;
};

interface FilesPageProps {
  client: Client;
  onUpdateClient: (client: Client) => void;
}

const SYSTEM_FOLDERS: Folder[] = [
  { id: 'logo', name: 'Logo', isSystem: true },
  { id: 'manual', name: 'Manual da Marca', isSystem: true },
  { id: 'colors', name: 'Cores da marca', isSystem: true },
  { id: 'icons', name: 'Ícones', isSystem: true },
  { id: 'graphics', name: 'Itens gráficos', isSystem: true },
  { id: 'voice', name: 'Voz da marca', isSystem: true },
  { id: 'videos', name: 'Vídeos', isSystem: true },
  { id: 'typography', name: 'Tipografia', isSystem: true },
  { id: 'fixed-info', name: 'Informações Fixas', isSystem: true },
];

const VOICE_OPTIONS = [
  'Formal', 'Informal', 'Engraçado', 'Sério', 'Inspirador', 'Educativo', 
  'Provocador', 'Acolhedor', 'Autoritário', 'Empático', 'Otimista', 'Pragmático'
];

const AUDIENCE_OPTIONS = [
  'B2B', 'B2C', 'Jovens (Z)', 'Millennials', 'Corporativo', 'Lifestile/Moda',
  'Saúde/Bem-estar', 'Educação', 'Tecnologia', 'Gastronomia', 'Infantil', 'Idosos'
];

const PRODUCT_OPTIONS = [
  'Produto Físico', 'Infoproduto', 'Serviço Local', 'SaaS/Software',
  'Consultoria', 'E-commerce', 'Influencer/Personal Brand', 'Evento/Experiência'
];

interface ColorsViewProps {
  client: Client;
  onUpdateClient: (client: Client) => void;
  hexToRgb: (hex: string) => string;
  hexToCmyk: (hex: string) => string;
}

function ColorsView({ client, onUpdateClient, hexToRgb, hexToCmyk }: ColorsViewProps) {
  const [hexInput, setHexInput] = useState('#');
  const [pantoneInput, setPantoneInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Paleta de Cores</h3>
          <p className="text-sm text-slate-500">Gerencie as cores oficiais da marca</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm transition-all focus-within:ring-2 focus-within:ring-brand/20">
              <input 
                type="text" 
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Nome da cor (ex: Primária)"
                className="bg-transparent border-none focus:outline-none text-xs font-bold w-40 px-2"
              />
              <div className="w-px h-6 bg-slate-100"></div>
              <input 
                type="color" 
                value={hexInput.length === 7 ? hexInput : '#000000'}
                onChange={(e) => setHexInput(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-none bg-transparent"
              />
              <input 
                type="text" 
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                placeholder="#000000"
                className="bg-transparent border-none focus:outline-none text-xs font-bold w-20 uppercase"
              />
              <input 
                type="text" 
                value={pantoneInput}
                onChange={(e) => setPantoneInput(e.target.value)}
                placeholder="Pantone (opcional)"
                className="bg-transparent border-none focus:outline-none text-xs font-medium w-32 border-l border-slate-100 pl-2"
              />
              <button 
                onClick={() => {
                  const newColor: BrandColor = {
                    name: nameInput || 'Cor sem nome',
                    hex: hexInput,
                    rgb: `rgb(${hexToRgb(hexInput)})`,
                    cmyk: hexToCmyk(hexInput),
                    pantone: pantoneInput || 'N/A'
                  };
                  onUpdateClient({
                    ...client,
                    brandPalette: [...(client.brandPalette || []), newColor]
                  });
                  setHexInput('#');
                  setPantoneInput('');
                  setNameInput('');
                }}
                className="bg-brand text-white p-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Plus size={16} />
              </button>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(client.brandPalette || []).map((color, i) => (
          <motion.div 
            layout
            key={i} 
            className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm group hover:shadow-md transition-all"
          >
            <div className="h-32 w-full relative" style={{ backgroundColor: color.hex }}>
               <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                {editingIndex === i ? (
                  <input 
                    autoFocus
                    type="text"
                    value={color.name}
                    onChange={(e) => {
                      const newPalette = [...(client.brandPalette || [])];
                      newPalette[i] = { ...color, name: e.target.value };
                      onUpdateClient({ ...client, brandPalette: newPalette });
                    }}
                    onBlur={() => setEditingIndex(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingIndex(null)}
                    className="text-sm font-bold text-slate-900 border-b border-brand focus:outline-none w-full"
                  />
                ) : (
                  <h4 
                    onClick={() => setEditingIndex(i)}
                    className="text-sm font-bold text-slate-900 cursor-pointer hover:text-brand transition-colors"
                  >
                    {color.name}
                  </h4>
                )}
                <button 
                  onClick={() => setEditingIndex(editingIndex === i ? null : i)}
                  className="text-slate-400 hover:text-brand opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Edit2 size={12} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{color.hex}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(color.hex);
                    toast.success('Hex copiado!');
                  }}
                  className="text-slate-400 hover:text-brand"
                >
                  <Copy size={12} />
                </button>
              </div>
              
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-50">
                 <div className="flex items-center justify-between">
                   <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">RGB</span>
                      <p className="text-xs font-medium text-slate-600">{color.rgb}</p>
                   </div>
                   <div className="space-y-1 text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Pantone</span>
                      <p className="text-xs font-medium text-brand">{color.pantone}</p>
                   </div>
                 </div>
                 <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">CMYK</span>
                    <p className="text-xs font-medium text-slate-600">{color.cmyk}</p>
                 </div>
              </div>
              <button 
                onClick={() => {
                  onUpdateClient({
                    ...client,
                    brandPalette: (client.brandPalette || []).filter((_, index) => index !== i)
                  });
                }}
                className="w-full mt-2 py-2 text-[10px] font-bold uppercase text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all underline decoration-red-500/20 underline-offset-4"
              >
                Remover Cor
              </button>
            </div>
          </motion.div>
        ))}
        {(!client.brandPalette || client.brandPalette.length === 0) && (
          <div className="col-span-full py-20 bg-slate-50 border border-dashed border-slate-300 rounded-3xl flex flex-col items-center justify-center text-slate-400">
             <Palette size={40} className="mb-4 opacity-20" />
             <p className="text-sm font-medium uppercase tracking-widest">Nenhuma cor adicionada</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface VoiceViewProps {
  client: Client;
  onUpdateClient: (client: Client) => void;
}

function VoiceView({ client, onUpdateClient }: VoiceViewProps) {
  const brandVoice = React.useMemo(() => {
    const raw = client.brandVoice || { 
      tone: [], 
      audience: [], 
      productType: [], 
      customOptions: { tone: [], audience: [], productType: [] } 
    } as BrandVoice;

    return {
      tone: Array.isArray(raw.tone) ? raw.tone : [],
      audience: Array.isArray(raw.audience) ? raw.audience : [],
      productType: Array.isArray(raw.productType) ? raw.productType : [],
      customOptions: {
        tone: Array.isArray(raw.customOptions?.tone) ? raw.customOptions.tone : [],
        audience: Array.isArray(raw.customOptions?.audience) ? raw.customOptions.audience : [],
        productType: Array.isArray(raw.customOptions?.productType) ? raw.customOptions.productType : [],
      }
    };
  }, [client.brandVoice]);

  const customOptions = brandVoice.customOptions;
  const [isEditingManual, setIsEditingManual] = useState(false);
  const [editedManual, setEditedManual] = useState('');
  const [addingOptionTo, setAddingOptionTo] = useState<'tone' | 'audience' | 'productType' | null>(null);
  const [newOptionValue, setNewOptionValue] = useState('');

  const getManualText = () => {
    const { tone, audience, productType } = brandVoice;
    if (tone.length === 0 && audience.length === 0 && productType.length === 0) {
      return "Preencha as etapas acima para gerar o manual de voz da marca.";
    }

    let text = `A marca ${client.name || 'da conta'} `;
    
    if (productType.length > 0) {
      text += `atua no segmento de ${productType.join(' e ')}, `;
    }

    if (audience.length > 0) {
      text += `comunicando-se diretamente com o público ${audience.join(', ')}. `;
    }

    if (tone.length > 0) {
      text += `Sua voz é caracterizada por um tom ${tone.join(', ')}, `;
    }

    text += `buscando sempre manter uma conexão autêntica e relevante com seus seguidores em todos os canais digitais.`;
    
    return text;
  };

  const handleToggleVoice = (voice: string, category: 'tone' | 'audience' | 'productType') => {
    const currentList = (brandVoice[category] || []) as string[];
    const newList = currentList.length > 0 && currentList.includes(voice)
      ? currentList.filter(v => v !== voice)
      : [...currentList, voice];
    
    onUpdateClient({
      ...client,
      brandVoice: {
        ...brandVoice,
        [category]: newList
      }
    });
  };

  const handleAddCustomOption = (category: 'tone' | 'audience' | 'productType') => {
    const value = newOptionValue.trim();
    if (!value) return;
    
    const currentCategoryOptions = (customOptions[category] || []) as string[];
    if (currentCategoryOptions.includes(value)) {
      setAddingOptionTo(null);
      setNewOptionValue('');
      return;
    }

    onUpdateClient({
      ...client,
      brandVoice: {
        ...brandVoice,
        customOptions: {
          ...customOptions,
          [category]: [...currentCategoryOptions, value]
        }
      }
    });
    setAddingOptionTo(null);
    setNewOptionValue('');
    toast.success('Opção adicionada!');
  };

  const handleRemoveCustomOption = (value: string, category: 'tone' | 'audience' | 'productType') => {
    const currentCategoryOptions = customOptions[category] || [];
    const currentSelected = brandVoice[category] || [];

    onUpdateClient({
      ...client,
      brandVoice: {
        ...brandVoice,
        [category]: currentSelected.filter(v => v !== value),
        customOptions: {
          ...customOptions,
          [category]: currentCategoryOptions.filter(v => v !== value)
        }
      }
    });
  };

  const renderOptionGroup = (title: string, subtitle: string, step: number, category: 'tone' | 'audience' | 'productType', systemOptions: string[]) => {
    const allOptions = [...new Set([...systemOptions, ...(customOptions[category] || [])])];
    
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-brand/20">{step}</div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={() => setAddingOptionTo(addingOptionTo === category ? null : category)}
            className={cn(
              "p-2 rounded-full transition-all flex items-center gap-2 px-4 py-2 text-xs font-bold",
              addingOptionTo === category 
                ? "bg-red-50 text-red-500" 
                : "text-brand hover:bg-brand/5 border border-brand/20"
            )}
          >
            {addingOptionTo === category ? <X size={18} /> : <Plus size={18} />}
            {addingOptionTo === category ? 'Cancelar' : 'Nova Escolha'}
          </button>
        </div>

        {addingOptionTo === category && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex gap-2"
          >
            <input 
              autoFocus
              type="text"
              placeholder={`Nova opção para ${title.toLowerCase()}...`}
              value={newOptionValue}
              onChange={(e) => setNewOptionValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomOption(category)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand/20 outline-none"
            />
            <button 
              onClick={() => handleAddCustomOption(category)}
              className="bg-brand text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand/10"
            >
              Adicionar
            </button>
          </motion.div>
        )}

        <div className="flex flex-wrap gap-3">
          {allOptions.map(option => (
            <div key={option} className="group relative">
              <button
                onClick={() => handleToggleVoice(option, category)}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-bold transition-all border",
                  (brandVoice[category] || []).includes(option)
                    ? "bg-brand text-white border-brand shadow-md"
                    : "bg-white text-slate-600 border-slate-200 hover:border-brand/40"
                )}
              >
                {option}
              </button>
              {customOptions[category]?.includes(option) && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveCustomOption(option, category);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {renderOptionGroup('Tom de Voz', 'Como a marca fala com o mundo?', 1, 'tone', VOICE_OPTIONS)}
      {renderOptionGroup('Público-Alvo', 'Para quem a marca direciona sua mensagem?', 2, 'audience', AUDIENCE_OPTIONS)}
      {renderOptionGroup('Tipo de Produto/Serviço', 'O que a marca entrega ao mercado?', 3, 'productType', PRODUCT_OPTIONS)}

      <div className="p-8 bg-brand/5 border border-brand/10 rounded-[40px] mt-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
             <Mic2 size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-brand uppercase tracking-widest">Manual de Voz da Marca</h4>
              <button 
                onClick={() => {
                  if (!isEditingManual) {
                    setEditedManual(client.brandVoiceManual || getManualText());
                  }
                  setIsEditingManual(!isEditingManual);
                }}
                className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-brand bg-white px-4 py-2 rounded-xl border border-slate-200 transition-all"
              >
                {isEditingManual ? <Check size={14} /> : <Edit2 size={14} />}
                {isEditingManual ? 'Finalizar Edição' : 'Editar Manual'}
              </button>
            </div>
            
            <div className="flex flex-col gap-6">
               {isEditingManual ? (
                 <textarea 
                   autoFocus
                   value={editedManual}
                   onChange={(e) => setEditedManual(e.target.value)}
                   className="w-full bg-white border border-brand/20 rounded-3xl p-6 text-slate-700 text-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand/10 min-h-[150px]"
                 />
               ) : (
                 <p className="text-slate-700 text-lg leading-relaxed italic font-medium">
                   "{client.brandVoiceManual || getManualText()}"
                 </p>
               )}
               
               <div className="flex items-center gap-4">
                 <button 
                   onClick={() => {
                      navigator.clipboard.writeText(client.brandVoiceManual || getManualText());
                      toast.success("Copiado!");
                   }}
                   className="flex items-center gap-2 text-xs font-bold text-brand hover:underline"
                 >
                   <Copy size={14} />
                   Copiar Texto
                 </button>
                 {!isEditingManual && (
                   <button 
                     onClick={() => {
                        onUpdateClient({
                          ...client,
                          brandVoiceManual: client.brandVoiceManual || getManualText()
                        });
                        toast.success("Manual salvo!");
                     }}
                     className="flex items-center gap-2 text-xs font-bold text-brand hover:underline"
                   >
                     <Check size={14} />
                     Salvar Manual
                   </button>
                 )}
                 {isEditingManual && (
                   <button 
                     onClick={() => {
                        onUpdateClient({
                          ...client,
                          brandVoiceManual: editedManual
                        });
                        setIsEditingManual(false);
                        toast.success("Manual atualizado!");
                     }}
                     className="flex items-center gap-2 text-xs font-bold text-brand hover:underline"
                   >
                     <PlusCircle size={14} />
                     Aplicar Alterações
                   </button>
                 )}
               </div>
            </div>
          </div>
      </div>
    </div>
  );
}

interface TypographyViewProps {
  client: Client;
  onUpdateClient: (client: Client) => void;
  handleUploadFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDeleteAsset: (id: string) => void;
}

function TypographyView({ client, onUpdateClient, handleUploadFile, handleDeleteAsset }: TypographyViewProps) {
  const assets = Array.isArray(client.assets) ? client.assets : [];
  const fonts = assets.filter(a => a.folderId === 'typography');
  const [selectedFont, setSelectedFont] = useState<BrandAsset | null>(null);
  const [previewText, setPreviewText] = useState('ABCDEFGHIJKLMNOPQRSTUVWXYZ\nabcdefghijklmnopqrstuvwxyz\n0123456789\n!@#$%^&*()_+-=[]{}|;:,.<>?');
  const [fontLoaded, setFontLoaded] = useState(false);

  // Auto-select first font or newly added font
  useEffect(() => {
    if (fonts.length > 0 && !selectedFont) {
      setSelectedFont(fonts[fonts.length - 1]);
    }
  }, [fonts, selectedFont]);

  // Load font dynamically using @font-face injection
  useEffect(() => {
    if (!selectedFont) {
      setFontLoaded(false);
      return;
    }

    const fontId = `font-${selectedFont.id}`;
    const styleId = `style-${fontId}`;
    
    // Remove previous style if exists
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      setFontLoaded(true);
      return;
    }

    const publicUrl = getAssetPublicUrl(selectedFont);

    const newStyle = document.createElement('style');
    newStyle.id = styleId;
    newStyle.textContent = `
      @font-face {
        font-family: "${fontId}";
        src: url("${publicUrl}");
        font-display: block;
      }
    `;
    document.head.appendChild(newStyle);

    // Try to detect when font is ready
    if ('fonts' in document) {
      document.fonts.load(`1em "${fontId}"`).then(() => {
        setFontLoaded(true);
      }).catch(() => {
        // Fallback: assume it works after a short delay
        setTimeout(() => setFontLoaded(true), 500);
      });
    } else {
      setTimeout(() => setFontLoaded(true), 500);
    }

    return () => {
      // We keep the style in head to avoid flashes when switching back and forth, 
      // but we could clean it up if memory is an issue.
    };
  }, [selectedFont]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Font Selection & Upload */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Type size={18} className="text-brand" />
              Fontes Carregadas
            </h3>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {fonts.map(font => (
                <div 
                  key={font.id}
                  onClick={() => setSelectedFont(font)}
                  className={cn(
                    "w-full p-4 rounded-2xl border text-left transition-all cursor-pointer group flex items-center justify-between",
                    selectedFont?.id === font.id 
                      ? "bg-brand/5 border-brand shadow-sm" 
                      : "bg-slate-50 border-transparent hover:bg-slate-100"
                  )}
                >
                  <div className="truncate pr-4">
                    <p className={cn("text-sm font-bold truncate", selectedFont?.id === font.id ? "text-brand" : "text-slate-700")}>
                      {font.name}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium mt-0.5">
                      {(font.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAsset(font.id);
                      if (selectedFont?.id === font.id) setSelectedFont(null);
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded-lg hover:bg-red-50"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              {fonts.length === 0 && (
                <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Type size={24} className="mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-medium uppercase tracking-widest px-4">Nenhuma fonte</p>
                </div>
              )}
            </div>

            <label className="flex items-center justify-center gap-2 w-full bg-brand text-white py-4 rounded-2xl font-bold cursor-pointer hover:opacity-90 transition-all shadow-lg shadow-brand/10 text-sm">
              <Upload size={16} />
              Carregar Nova Fonte
              <input 
                type="file" 
                className="hidden" 
                accept=".ttf,.otf,.woff,.woff2"
                onChange={handleUploadFile}
              />
            </label>
          </div>

          <div className="bg-slate-900 text-white p-8 rounded-[40px] space-y-4 shadow-xl">
            <h4 className="text-xs font-bold text-white/50 uppercase tracking-widest">Dica de Apresentação</h4>
            <p className="text-sm font-medium leading-relaxed">
              Use a área de visualização para mostrar ao cliente como a marca se comporta em diferentes contextos de escrita.
            </p>
            <div className="pt-4 flex flex-wrap gap-2">
              <button 
                onClick={() => setPreviewText('O rato roeu a roupa do rei de Roma.')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-all"
              >
                Frase Curta
              </button>
              <button 
                onClick={() => setPreviewText('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-all"
              >
                Lorem Ipsum
              </button>
              <button 
                onClick={() => setPreviewText('ABCDEFGHIJKLMNOPQRSTUVWXYZ\n0123456789')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold transition-all"
              >
                Alphabet/Numbers
              </button>
            </div>
          </div>
        </div>

        {/* Main Content: Interactive Preview */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm flex flex-col h-full min-h-[500px]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Visualização Interativa</h3>
                <p className="text-sm text-slate-500">Transforme o texto abaixo para testar a tipografia</p>
              </div>
              <div className="bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Fonte Ativa</span>
                <p className="text-xs font-bold text-slate-700">{selectedFont?.name || 'Selecione uma fonte'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-between">
                Insira Símbolos, Números ou Letras
                <span className="text-brand lowercase font-normal italic">Edite o texto abaixo para atualizar o preview</span>
              </label>
              <textarea 
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand/10 transition-all text-sm min-h-[120px] resize-none"
                placeholder="Digite aqui símbolos, letras ou números..."
              />
            </div>

            <div className="mt-8 flex-1 bg-white border-2 border-dashed border-slate-100 rounded-3xl p-8 relative overflow-hidden flex items-center justify-center text-center">
              {selectedFont ? (
                <div 
                  className={cn(
                    "text-5xl md:text-6xl transition-all duration-300 break-words whitespace-pre-wrap w-full",
                    !fontLoaded && "blur-sm opacity-50"
                  )}
                  style={{ fontFamily: `"font-${selectedFont.id}", sans-serif` }}
                >
                  {previewText}
                </div>
              ) : (
                <div className="text-slate-300">
                  <Type size={100} className="mx-auto mb-6 opacity-5" />
                  <p className="text-lg font-bold">Nenhuma fonte selecionada para preview</p>
                  <p className="text-sm mt-2">Escolha uma fonte da lista lateral</p>
                </div>
              )}
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600">
                  <Check size={16} />
                </div>
                <p className="text-xs font-bold text-slate-600">Pronto para apresentação ao cliente</p>
              </div>
              <button 
                onClick={() => toast.success("Screenshot da tipografia capturado!")}
                className="px-6 py-2.5 bg-brand/5 text-brand rounded-xl font-bold text-xs hover:bg-brand/10 transition-all"
              >
                Exportar Preview
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FixedInfoView({ client, onUpdateClient }: { client: Client; onUpdateClient: (client: Client) => void }) {
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [showPassword, setShowPassword] = useState<{ [key: string]: boolean }>({});
  const [isAdding, setIsAdding] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FixedInfoItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editValue, setEditValue] = useState('');

  const handleAddInfo = () => {
    if (!newLabel || !newValue) return;
    const newItem: FixedInfoItem = {
      id: Math.random().toString(36).substr(2, 9),
      label: newLabel,
      value: newValue
    };
    onUpdateClient({
      ...client,
      fixedInfo: [...(client.fixedInfo || []), newItem]
    });
    setNewLabel('');
    setNewValue('');
    setIsAdding(false);
    toast.success('Informação adicionada!');
  };

  const handleUpdateInfo = () => {
    if (!selectedItem || !editLabel || !editValue) return;
    
    const updatedFixedInfo = (client.fixedInfo || []).map(item => 
      item.id === selectedItem.id 
        ? { ...item, label: editLabel, value: editValue }
        : item
    );

    onUpdateClient({
      ...client,
      fixedInfo: updatedFixedInfo
    });

    setSelectedItem(prev => prev ? { ...prev, label: editLabel, value: editValue } : null);
    setIsEditing(false);
    toast.success('Informação atualizada!');
  };

  const handleRemoveInfo = (id: string) => {
    onUpdateClient({
      ...client,
      fixedInfo: (client.fixedInfo || []).filter(item => item.id !== id)
    });
    if (selectedItem?.id === id) setSelectedItem(null);
    toast.success('Informação removida.');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Informações Fixas</h3>
          <p className="text-sm text-slate-500">Logins, senhas, CNPJ e detalhes de funcionamento</p>
        </div>
        
        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-2xl font-bold whitespace-nowrap hover:opacity-90 transition-all shadow-lg shadow-brand/20 active:scale-95"
            >
              <Plus size={18} />
              Nova Informação
            </button>
          ) : (
            <div className="bg-white p-5 rounded-[28px] border border-slate-200 shadow-xl w-full md:w-96 animate-in zoom-in-95 duration-200">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Título (Ex: Instagram)</label>
                  <input 
                    type="text" 
                    autoFocus
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Nome da rede ou info"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Informações</label>
                  <textarea 
                    rows={4}
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    placeholder="Login: valor\nSenha: valor"
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-brand/20 transition-all resize-none"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAddInfo}
                    disabled={!newLabel || !newValue}
                    className="flex-1 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {(client.fixedInfo || []).map((item) => (
          <motion.div 
            layout
            key={item.id}
            onClick={() => {
              setSelectedItem(item);
              setEditLabel(item.label);
              setEditValue(item.value);
              setIsEditing(false);
            }}
            className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm group hover:shadow-md transition-all relative overflow-hidden flex flex-col items-center justify-center text-center cursor-pointer active:scale-95"
          >
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-brand/10 group-hover:text-brand transition-all duration-300 mb-4">
              <ShieldCheck size={24} />
            </div>
            <span className="text-[11px] font-black text-brand uppercase tracking-[0.2em] block line-clamp-1">{item.label}</span>
          </motion.div>
        ))}

        {(!client.fixedInfo || client.fixedInfo.length === 0) && !isAdding && (
          <div className="col-span-full py-24 bg-white border-2 border-dashed border-slate-200 rounded-[40px] flex flex-col items-center justify-center text-slate-400">
             <div className="w-20 h-20 bg-slate-50 rounded-[30px] flex items-center justify-center shadow-inner mb-6">
                <ShieldCheck size={40} className="opacity-20" />
             </div>
             <p className="text-sm font-black uppercase tracking-[0.2em]">Nenhuma informação fixa</p>
             <p className="text-xs text-slate-400 mt-2 font-medium">Use o botão acima para cadastrar logins e dados importantes</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedItem(null);
                setIsEditing(false);
              }}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] shadow-2xl relative overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand/10 text-brand rounded-xl flex items-center justify-center">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <span className="text-[10px] font-black text-brand uppercase tracking-widest block">Informação Fixa</span>
                      <h4 className="text-xl font-bold text-slate-900">
                        {isEditing ? 'Editando Informação' : selectedItem.label}
                      </h4>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setSelectedItem(null);
                      setIsEditing(false);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 relative group">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Título</label>
                        <input 
                          type="text" 
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-brand/20 transition-all"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Conteúdo</label>
                        <textarea 
                          rows={4}
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-brand/20 transition-all resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={handleUpdateInfo}
                          className="flex-1 bg-brand text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-all shadow-md shadow-brand/20"
                        >
                          Salvar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <pre className="text-sm font-bold text-slate-700 whitespace-pre-line font-sans leading-relaxed">
                        {selectedItem.label.toLowerCase().includes('senha') && !showPassword[selectedItem.id] 
                          ? selectedItem.value.split('\n').map(line => {
                              if (line.toLowerCase().includes('senha:')) {
                                const [label, val] = line.split(':');
                                return `${label}: ••••••••`;
                              }
                              return line;
                            }).join('\n')
                          : selectedItem.value}
                      </pre>
                      
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-200/50">
                        {selectedItem.value.toLowerCase().includes('senha:') && (
                          <button 
                            onClick={() => setShowPassword(prev => ({ ...prev, [selectedItem.id]: !prev[selectedItem.id] }))}
                            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:text-brand hover:border-brand/20 transition-all shadow-sm"
                          >
                            <Eye size={14} />
                            {showPassword[selectedItem.id] ? 'Exibir' : 'Ocultar'}
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedItem.value);
                            toast.success('Copia completa!');
                          }}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:text-brand hover:border-brand/20 transition-all shadow-sm"
                        >
                          <Copy size={14} />
                          Copiar
                        </button>
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:text-brand hover:border-brand/20 transition-all shadow-sm"
                        >
                          <Edit3 size={14} />
                          Editar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {!isEditing && (
                  <div className="flex items-center justify-center pt-2">
                    <button 
                      onClick={() => {
                        if (confirm('Tem certeza que deseja excluir esta informação?')) {
                          handleRemoveInfo(selectedItem.id);
                        }
                      }}
                      className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                      Excluir Informação
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilesPage({ client, onUpdateClient }: FilesPageProps) {
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedPreviewAsset, setSelectedPreviewAsset] = useState<BrandAsset | null>(null);
  
  // Ensure client has folders initialized
  const allFolders = [...SYSTEM_FOLDERS, ...(client.folders || [])];
  const activeFolder = allFolders.find(f => f.id === activeFolderId);
  
  const assets = Array.isArray(client.assets) ? client.assets : [];
  const filteredAssets = assets.filter(a => a.folderId === activeFolderId && (a.name || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const handleCreateFolder = () => {
    if (!newFolderName) return;
    const newFolder: Folder = {
      id: Math.random().toString(36).substr(2, 9),
      name: newFolderName,
      isSystem: false
    };
    onUpdateClient({
      ...client,
      folders: [...(Array.isArray(client.folders) ? client.folders : []), newFolder]
    });
    setNewFolderName('');
    setIsAddingFolder(false);
    toast.success('Pasta criada com sucesso!');
  };

  const handleDeleteFolder = async (folderId: string) => {
    const folderToDelete = (client.folders || []).find(f => f.id === folderId);
    if (!folderToDelete) return;

    try {
      toast.loading('Excluindo pasta e conteúdo...');

      // 1. Apagar arquivos do Storage
      const folderAssets = assets.filter(a => a.folderId === folderId);
      const storagePaths = folderAssets.map(a => a.path).filter(Boolean) as string[];
      if (storagePaths.length > 0) {
        await supabaseService.deleteFileFromStorage('files', storagePaths);
      }

      // 2. Apagar registros da tabela files
      await supabaseService.deleteFilesByFolder(client.id, folderId);

      // 3. Adicionalmente, tentar apagar a pasta caso ela seja um registro na tabela files (conforme regra 3)
      await supabase.from("files").delete().eq("folder_id", folderId);

      // 4. Remover do array de pastas do cliente e atualizar estado global
      const updatedFolders = (client.folders || []).filter(f => f.id !== folderId);
      
      onUpdateClient({
        ...client,
        folders: updatedFolders,
        assets: assets.filter(a => a.folderId !== folderId)
      });

      toast.dismiss();
      toast.success('Pasta excluída com sucesso!');
    } catch (err: any) {
      console.error('Delete folder error:', err);
      toast.dismiss();
      toast.error('Erro ao excluir pasta: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !activeFolderId) return;

    try {
      toast.loading('Fazendo upload de arquivos...');
      
      const uploadPromises = Array.from(files).map(async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${client.id}/${activeFolderId}/${fileName}`;

        // 1. Upload novo deve enviar o arquivo físico para o bucket "files"
        const storagePath = await supabaseService.uploadFile('files', filePath, file);
        
        // Get public URL
        const { data } = supabase.storage.from('files').getPublicUrl(storagePath);

        // 2. Salvar na tabela files
        const savedAsset = await supabaseService.saveFile(client.id, {
          name: file.name,
          url: data.publicUrl,
          path: storagePath,
          publicUrl: data.publicUrl,
          type: file.type,
          mimeType: file.type,
          size: file.size,
          folderId: activeFolderId
        });

        return savedAsset;
      });

      const uploadedAssets = await Promise.all(uploadPromises);

      onUpdateClient({
        ...client,
        assets: [...(Array.isArray(client.assets) ? client.assets : []), ...uploadedAssets]
      });
      
      toast.dismiss();
      toast.success(`${files.length} arquivo(s) adicionado(s).`);
    } catch (err: any) {
      console.error('Upload error:', err);
      toast.dismiss();
      toast.error('Erro ao fazer upload: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleDeleteAsset = async (id: string) => {
    const assetToDelete = (Array.isArray(client.assets) ? client.assets : []).find(a => a.id === id);
    
    try {
      if (assetToDelete) {
        // 4. Para deletar: deletar primeiro do Storage usando path
        if (assetToDelete.path) {
          await supabaseService.deleteFileFromStorage('files', assetToDelete.path);
        }
        
        // depois deletar da tabela files pelo id
        // Se o ID for UUID (do banco), deleta via serviço
        if (id.length > 20) { // IDs temporários são curtos, UUIDs são longos
           await supabaseService.deleteFile(id);
        }
      }

      onUpdateClient({
        ...client,
        assets: (Array.isArray(client.assets) ? client.assets : []).filter(a => a.id !== id)
      });
      toast.success('Arquivo removido.');
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Erro ao remover arquivo: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
  };

  const hexToCmyk = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0%, 0%, 0%, 100%';

    const r = parseInt(result[1], 16) / 255;
    const g = parseInt(result[2], 16) / 255;
    const b = parseInt(result[3], 16) / 255;

    const k = 1 - Math.max(r, g, b);
    const c = (1 - r - k) / (1 - k) || 0;
    const m = (1 - g - k) / (1 - k) || 0;
    const y = (1 - b - k) / (1 - k) || 0;

    return `${Math.round(c * 100)}%, ${Math.round(m * 100)}%, ${Math.round(y * 100)}%, ${Math.round(k * 100)}%`;
  };

  const handleAddColor = (hex: string) => {
    const newColor: BrandColor = {
      name: 'Nova Cor',
      hex,
      rgb: `rgb(${hexToRgb(hex)})`,
      cmyk: hexToCmyk(hex),
      pantone: 'Pendente' // Simplification
    };
    onUpdateClient({
      ...client,
      brandPalette: [...(client.brandPalette || []), newColor]
    });
  };

  const renderFilesView = () => {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Pesquisar arquivos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
             <label className="flex items-center gap-2 bg-brand hover:opacity-90 text-white px-6 py-2.5 rounded-xl font-bold cursor-pointer transition-all shadow-lg shadow-brand/10">
                <Upload size={18} />
                Fazer Upload
                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  onChange={handleUploadFile}
                  accept={activeFolderId === 'typography' ? '.ttf,.otf,.woff,.woff2' : '*'}
                />
             </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAssets.map(asset => {
            const publicUrl = getAssetPublicUrl(asset);

            return (
              <motion.div 
                layout
                key={asset.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm group hover:shadow-md transition-all relative"
              >
                <div className="aspect-square bg-slate-50 flex items-center justify-center p-4">
                   {publicUrl ? (
                     asset.type.startsWith('image/') ? (
                       <img src={publicUrl} alt={asset.name} className="max-w-full max-h-full rounded-lg object-contain shadow-sm" referrerPolicy="no-referrer" />
                     ) : asset.type.startsWith('video/') ? (
                       <Video size={48} className="text-slate-300" />
                     ) : (
                       <File size={48} className="text-slate-300" />
                     )
                   ) : (
                     <div className="text-center p-2">
                       <AlertCircle size={32} className="mx-auto mb-2 text-slate-300" />
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Arquivo antigo sem Storage</p>
                     </div>
                   )}
                </div>
                <div className="p-4">
                   <p className="text-sm font-bold text-slate-900 truncate" title={asset.name}>{asset.name}</p>
                   <p className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                     {(asset.size / 1024 / 1024).toFixed(2)} MB • {asset.type.split('/')[1] || 'Arquivo'}
                   </p>
                   
                   <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleDeleteAsset(asset.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button 
                          onClick={() => setSelectedPreviewAsset(asset)}
                          className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                          title="Visualizar"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                      {publicUrl && (
                        <a 
                          href={publicUrl} 
                          download={asset.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-brand hover:bg-brand/10 rounded-lg transition-all"
                          title="Download"
                        >
                          <Download size={16} />
                        </a>
                      )}
                   </div>
                </div>
              </motion.div>
            );
          })}

          {filteredAssets.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center bg-slate-50 border border-dashed border-slate-300 rounded-3xl text-slate-400">
               <Upload size={40} className="mb-4 opacity-20" />
               <p className="text-sm font-medium uppercase tracking-widest text-center px-8">
                 Nenhum arquivo nesta pasta.
               </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderFolderList = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {allFolders.map((folder) => {
          const folderAssets = assets.filter(a => a.folderId === folder.id);
          const Icon = folder.id === 'colors' ? Palette : folder.id === 'voice' ? Mic2 : folder.id === 'videos' ? Video : folder.id === 'typography' ? Type : folder.id === 'fixed-info' ? ShieldCheck : FolderOpen;
          
          return (
            <motion.div
              layout
              key={folder.id}
              onClick={() => setActiveFolderId(folder.id)}
              className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer transition-all group"
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors shadow-inner",
                folder.id === 'colors' ? "bg-brand/10 text-brand" : 
                folder.id === 'voice' ? "bg-amber-50 text-amber-600" :
                folder.id === 'fixed-info' ? "bg-emerald-50 text-emerald-600" :
                "bg-slate-50 text-slate-400 group-hover:bg-brand group-hover:text-white"
              )}>
                <div className="group-hover:scale-110 transition-transform duration-300">
                  <Icon size={28} />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={cn(
                    "font-bold text-slate-900 leading-tight",
                    folder.isSystem ? "text-lg" : "text-base"
                  )}>{folder.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium italic">
                    {folder.id === 'colors' ? `${client.brandPalette?.length || 0} cores` : 
                     folder.id === 'voice' ? 'Definir Voz' :
                     folder.id === 'fixed-info' ? `${client.fixedInfo?.length || 0} informações` :
                     `${folderAssets.length} arquivos`}
                  </p>
                </div>
                {!folder.isSystem && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(folder.id);
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}

        <button 
          onClick={() => setIsAddingFolder(true)}
          className="p-6 rounded-[32px] border border-dashed border-slate-300 hover:border-brand/40 hover:bg-brand/5 transition-all group flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]"
        >
          <div className="w-12 h-12 bg-slate-50 text-slate-400 group-hover:bg-brand group-hover:text-white rounded-2xl flex items-center justify-center transition-all shadow-sm">
            <Plus size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Nova Pasta</h3>
            <p className="text-xs text-slate-500 mt-1">Organize seus ativos</p>
          </div>
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {activeFolderId && (
            <button 
              onClick={() => setActiveFolderId(null)}
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-brand hover:border-brand/20 transition-all shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeFolder ? activeFolder.name : 'Arquivos da Marca'}
            </h1>
            <p className="text-slate-500 text-sm">
              {activeFolder ? `Gerenciando ativos da pasta ${activeFolder.name}` : `Repositório oficial para ${client.name}`}
            </p>
          </div>
        </div>
      </div>

      {!activeFolderId ? renderFolderList() : (
        activeFolderId === 'colors' ? (
          <ColorsView 
            client={client} 
            onUpdateClient={onUpdateClient} 
            hexToRgb={hexToRgb} 
            hexToCmyk={hexToCmyk}
          />
        ) : 
        activeFolderId === 'voice' ? (
          <VoiceView 
            client={client} 
            onUpdateClient={onUpdateClient} 
          />
        ) : 
        activeFolderId === 'typography' ? (
          <TypographyView 
            client={client} 
            onUpdateClient={onUpdateClient}
            handleUploadFile={handleUploadFile}
            handleDeleteAsset={handleDeleteAsset}
          />
        ) :
        activeFolderId === 'fixed-info' ? (
          <FixedInfoView 
            client={client}
            onUpdateClient={onUpdateClient}
          />
        ) :
        renderFilesView()
      )}

      {/* Add Folder Modal */}
      <AnimatePresence>
        {selectedPreviewAsset && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-slate-950/90 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-5xl bg-white/5 border border-white/10 rounded-[32px] overflow-hidden shadow-2xl flex flex-col h-[85vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 bg-brand/20 rounded-xl flex items-center justify-center text-brand">
                      {selectedPreviewAsset.type.startsWith('image/') ? <File size={20} /> : selectedPreviewAsset.type.startsWith('video/') ? <Video size={20} /> : <File size={20} />}
                   </div>
                   <div>
                      <h3 className="font-bold text-white text-lg">{selectedPreviewAsset.name}</h3>
                      <p className="text-white/40 text-xs font-medium">{(selectedPreviewAsset.size / 1024 / 1024).toFixed(2)} MB • {selectedPreviewAsset.type}</p>
                   </div>
                </div>
                <div className="flex items-center gap-2">
                  <a 
                    href={getAssetPublicUrl(selectedPreviewAsset)} 
                    download={selectedPreviewAsset.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-all"
                    title="Download"
                  >
                    <Download size={20} />
                  </a>
                  <button 
                    onClick={() => setSelectedPreviewAsset(null)}
                    className="p-3 bg-white/10 text-white hover:bg-red-500 transition-all rounded-xl shadow-lg"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Viewer Content */}
              <div className="flex-1 bg-black/40 flex items-center justify-center overflow-hidden">
                 {(() => {
                   const publicUrl = getAssetPublicUrl(selectedPreviewAsset);

                   if (!publicUrl) {
                     return (
                       <div className="text-center text-white/60">
                          <AlertCircle size={80} className="mx-auto mb-4 opacity-20 text-red-500" />
                          <p className="font-bold text-red-400 uppercase tracking-widest">Arquivo não encontrado no Storage</p>
                       </div>
                     );
                   }

                   return selectedPreviewAsset.type.startsWith('image/') ? (
                     <img 
                      src={publicUrl} 
                      alt={selectedPreviewAsset.name} 
                      className="max-w-full max-h-full object-contain"
                      referrerPolicy="no-referrer"
                     />
                   ) : selectedPreviewAsset.type.startsWith('video/') ? (
                     <video 
                      src={publicUrl} 
                      controls 
                      autoPlay
                      className="max-w-full max-h-full shadow-2xl"
                     />
                   ) : selectedPreviewAsset.type === 'application/pdf' || selectedPreviewAsset.name.toLowerCase().endsWith('.pdf') ? (
                     <iframe 
                      src={`${publicUrl}#toolbar=0`}
                      className="w-full h-full border-none bg-white"
                      title="PDF Preview"
                     />
                   ) : (
                     <div className="text-center text-white/60">
                        <File size={80} className="mx-auto mb-4 opacity-20" />
                        <p className="font-medium">Pré-visualização não disponível para este formato.</p>
                        <a 
                          href={publicUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-brand hover:underline mt-4 inline-block font-bold"
                        >
                          Clique aqui para abrir em nova aba
                        </a>
                     </div>
                   );
                 })()}
              </div>
            </motion.div>
          </div>
        )}
        {isAddingFolder && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden"
            >
               <div className="p-8 border-b border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-xl font-bold text-slate-900">Nova Pasta</h2>
                     <button onClick={() => setIsAddingFolder(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                     </button>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Nome da pasta..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-brand/20"
                    autoFocus
                  />
               </div>
               <div className="p-6 bg-slate-50 flex items-center gap-3">
                  <button onClick={() => setIsAddingFolder(false)} className="flex-1 py-4 text-sm font-bold text-slate-600">Cancelar</button>
                  <button onClick={handleCreateFolder} className="flex-1 py-4 bg-brand text-white rounded-2xl font-bold shadow-lg shadow-brand/20">Criar Pasta</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
