export type UserRole = 'Admin' | 'Social Media' | 'Social Midia' | 'Designer' | 'Copywriter' | 'Gestor de Tráfego' | 'Cliente';

export interface EditorialItem {
  id: string;
  title?: string;
  description?: string;
  category: string;
  subcategory?: string;
  funnelType: 'Topo' | 'Meio' | 'Base' | string;
  objective: string;
  contentType?: string;
  frequency?: string;
  order: number;
}

export interface BrandColor {
  name: string;
  hex: string;
  rgb: string;
  cmyk: string;
  pantone: string;
}

export interface BrandAsset {
  id: string;
  name: string;
  url: string;
  path?: string;
  publicUrl?: string;
  type: string;
  mimeType?: string;
  size: number;
  folderId: string;
  uploadedBy?: string;
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  isSystem?: boolean;
}

export interface BrandVoice {
  tone: string[];
  audience: string[];
  productType: string[];
  customOptions?: {
    tone: string[];
    audience: string[];
    productType: string[];
  };
}

export interface FixedInfoItem {
  id: string;
  label: string;
  value: string;
}

export interface Client {
  id: string;
  name: string;
  logo: string;
  primaryColor: string;
  socialMedia: string[];
  responsible: string;
  observations: string;
  editorialLine: EditorialItem[];
  followerHistory: { date: string; count: number }[];
  bio?: string;
  brandVoiceManual?: string;
  brandPalette?: BrandColor[];
  brandVoice?: BrandVoice;
  assets?: BrandAsset[];
  folders?: Folder[];
  fixedInfo?: FixedInfoItem[];
}

export type PostStatus = 
  | 'Ideia' | 'Criando' 
  | 'Revisão' | 'Enviar para cliente' 
  | 'Aprovado' | 'Postado' | 'Recusado' | 'Falha';

export type PostFormat = 'Estático' | 'Carrossel' | 'Reels' | 'Story' | 'Vídeo';
export type PostChannel = string;

export interface PostMetrics {
  impressions?: number;
  reach: number;
  plays: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
}

export interface Post {
  id: string;
  clientId: string;
  title: string;
  date: string;
  status: PostStatus;
  channels: string[];
  format: PostFormat;
  editorialItemId: string;
  image?: string;
  description: string;
  responsible: string;
  responsibleId?: string;
  checklist: { id: string; text: string; completed: boolean }[];
  comments: { id: string; user: string; text: string; date: string }[];
  metrics: PostMetrics;
}

export interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email?: string;
  status?: 'Ativo' | 'Inativo';
  permission?: 'Admin' | 'Colaborador';
}

export type CommemorativeDateCategory = 'Data comemorativa' | 'Aniversário' | 'Tempo de Empresa' | 'Aniversariante do mês' | 'Reunião de ciclo' | 'Reunião' | string;

export interface CommemorativeDate {
  id: string;
  clientId?: string;
  title: string;
  date: string; // ISO format
  type: 'automatic' | 'manual';
  category: CommemorativeDateCategory;
  description?: string;
  status?: PostStatus;
}

export interface AgencySettings {
  name: string;
  logo: string;
  contactEmail: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  preferredClientId?: string;
  preferredClientName?: string;
}

export type TaskStatus = 'Fazer' | 'Em andamento' | 'Pausado' | 'Aguardando' | 'Revisão' | 'Aprovação' | 'Feito';

export interface Task {
  id: string;
  clientId: string;
  title: string;
  requester: string;
  deliveryDate: string;
  status: TaskStatus;
  responsible: string;
  responsibleId?: string;
  description?: string;
  checklist: { id: string; text: string; completed: boolean }[];
}

export interface FinancialItem {
  id: string;
  description: string;
  value: number;
}

export interface FinancialReport {
  id: string;
  clientId: string;
  month: string;
  title: string;
  dueDate: string;
  items: FinancialItem[];
  status: 'Pendente' | 'Pago' | 'Atrasado';
  paymentInfo: {
    bank: string;
    pix: string;
    cpfCnpj: string;
    beneficiary: string;
  };
  total: number;
  observations?: string;
  createdAt: string;
}
