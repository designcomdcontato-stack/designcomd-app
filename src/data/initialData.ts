import { Client, Post, TeamMember, EditorialItem, Task, AgencySettings } from '../types';

export const INITIAL_EDITORIAL_LINE: EditorialItem[] = [
  { id: '1', category: 'Dica', funnelType: 'Topo', objective: 'Impacto', order: 0 },
  { id: '2', category: 'Notícia (comunicado)', funnelType: 'Topo', objective: 'Impacto', order: 1 },
  { id: '3', category: 'Trend (meme)', funnelType: 'Topo', objective: 'Impacto', order: 2 },
  { id: '4', category: 'Curiosidade', funnelType: 'Topo', objective: 'Impacto', order: 3 },
  { id: '5', category: 'Real ou Improvável', funnelType: 'Topo', objective: 'Impacto', order: 4 },
  { id: '6', category: 'Ed. Financeira', funnelType: 'Topo', objective: 'Impacto', order: 5 },
  { id: '7', category: 'Ação (evento, campanha)', funnelType: 'Meio', objective: 'Aproximação', order: 6 },
  { id: '8', category: 'Empresa (dia a dia, bastidores)', funnelType: 'Meio', objective: 'Aproximação', order: 7 },
  { id: '9', category: 'Data Comemorativa', funnelType: 'Meio', objective: 'Aproximação', order: 8 },
  { id: '10', category: 'Motivacional (respiro, TBT)', funnelType: 'Meio', objective: 'Aproximação', order: 9 },
  { id: '11', category: 'MKT quer saber', funnelType: 'Meio', objective: 'Aproximação', order: 10 },
  { id: '12', category: 'Carro', funnelType: 'Base', objective: 'Produto', order: 11 },
  { id: '13', category: 'Consórcio', funnelType: 'Base', objective: 'Produto', order: 12 },
  { id: '14', category: 'ABAC (dados)', funnelType: 'Base', objective: 'Produto', order: 13 },
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: '80808080-8080-4080-a080-808080808001',
    name: 'Restaurante Sabor & Arte',
    logo: 'https://picsum.photos/seed/restaurant/200',
    primaryColor: '#e11d48',
    socialMedia: ['Instagram', 'Facebook'],
    responsible: 'Ana Silva',
    observations: 'Foco em pratos executivos e sobremesas.',
    editorialLine: [...INITIAL_EDITORIAL_LINE],
    followerHistory: [
      { date: '2026-03-01', count: 1200 },
      { date: '2026-03-10', count: 1250 },
      { date: '2026-03-20', count: 1310 },
    ],
    bio: '🍽️ Experiência gastronômica única\n🥗 Ingredientes frescos e selecionados\n📍 Rua das Flores, 123 - Centro\n👇 Faça sua reserva!',
    fixedInfo: [
      { id: 'f1', label: 'Instagram Login', value: 'sabor_arte_oficial' },
      { id: 'f2', label: 'Instagram Senha', value: 'sabor123arte' },
      { id: 'f3', label: 'CNPJ', value: '12.345.678/0001-99' },
    ]
  },
  {
    id: '80808080-8080-4080-a080-808080808002',
    name: 'Tech Solutions',
    logo: 'https://picsum.photos/seed/tech/200',
    primaryColor: '#2563eb',
    socialMedia: ['Instagram', 'LinkedIn'],
    responsible: 'Bruno Costa',
    observations: 'B2B, foco em autoridade.',
    editorialLine: [...INITIAL_EDITORIAL_LINE],
    followerHistory: [
      { date: '2026-03-01', count: 5400 },
      { date: '2026-03-15', count: 5600 },
    ],
    bio: '🚀 Transformação Digital para o seu negócio\n💻 Desenvolvimento de Software & Cloud\n💡 Inovação que gera resultados\n🔗 Saiba mais no link abaixo',
    fixedInfo: [
      { id: 'f4', label: 'CNPJ', value: '98.765.432/0001-00' },
      { id: 'f5', label: 'Horário', value: 'Seg-Sex: 09h às 18h' },
    ]
  },
];

export const INITIAL_TEAM: TeamMember[] = [
  { id: '7c7c7c7c-7c7c-4c7c-bc7c-7c7c7c7c7c01', name: 'João Admin', role: 'Admin', avatar: 'https://i.pravatar.cc/150?u=t1' },
  { id: '7c7c7c7c-7c7c-4c7c-bc7c-7c7c7c7c7c02', name: 'Maria Social', role: 'Social Media', avatar: 'https://i.pravatar.cc/150?u=t2' },
  { id: '7c7c7c7c-7c7c-4c7c-bc7c-7c7c7c7c7c03', name: 'Pedro Designer', role: 'Designer', avatar: 'https://i.pravatar.cc/150?u=t3' },
];

export const INITIAL_POSTS: Post[] = [
  {
    id: '8a8a8a8a-8a8a-4a8a-aa8a-8a8a8a8a8a01',
    clientId: '80808080-8080-4080-a080-808080808001',
    title: 'Dica de Alimentação Saudável',
    date: '2026-03-26',
    status: 'Criando',
    channels: ['Instagram'],
    format: 'Estático',
    editorialItemId: '1',
    image: 'https://picsum.photos/seed/food1/800/800',
    description: 'Legenda sobre como manter uma dieta equilibrada mesmo comendo fora.',
    responsible: 'Maria Social',
    checklist: [
      { id: '1', text: 'Criar arte', completed: true },
      { id: '2', text: 'Escrever legenda', completed: false },
    ],
    comments: [],
    metrics: { reach: 0, plays: 0, likes: 0, comments: 0, shares: 0, saves: 0 },
  },
  {
    id: '8a8a8a8a-8a8a-4a8a-aa8a-8a8a8a8a8a02',
    clientId: '80808080-8080-4080-a080-808080808001',
    title: 'Prato do Dia: Risoto de Alho Poró',
    date: '2026-03-25',
    status: 'Postado',
    channels: ['Instagram'],
    format: 'Reels',
    editorialItemId: '13',
    image: 'https://picsum.photos/seed/food2/800/800',
    description: 'Vídeo mostrando a preparação do nosso risoto mais pedido.',
    responsible: 'Pedro Designer',
    checklist: [],
    comments: [],
    metrics: { reach: 1500, plays: 1200, likes: 145, comments: 12, shares: 8, saves: 25 },
  },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: '9b9b9b9b-9b9b-4b9b-ab9b-9b9b9b9b9b01',
    clientId: '80808080-8080-4080-a080-808080808001',
    title: 'Manual de Identidade Visual',
    requester: 'Ana Silva',
    deliveryDate: '2026-03-28',
    status: 'Em andamento',
    responsible: 'Pedro Designer',
    description: 'Criar o manual completo da marca Sabor & Arte.',
    checklist: [
      { id: '1', text: 'Pesquisa de referências', completed: true },
      { id: '2', text: 'Definição de tipografia', completed: false }
    ]
  },
  {
    id: '9b9b9b9b-9b9b-4b9b-ab9b-9b9b9b9b9b02',
    clientId: '80808080-8080-4080-a080-808080808001',
    title: 'Campanha de Páscoa',
    requester: 'Ana Silva',
    deliveryDate: '2026-04-10',
    status: 'Revisão',
    responsible: 'Maria Social',
    description: 'Artes e legendas para a semana da Páscoa.',
    checklist: []
  },
  {
    id: '9b9b9b9b-9b9b-4b9b-ab9b-9b9b9b9b9b03',
    clientId: '80808080-8080-4080-a080-808080808002',
    title: 'Newsletter Mensal',
    requester: 'Bruno Costa',
    deliveryDate: '2026-04-05',
    status: 'Fazer',
    responsible: 'João Admin',
    description: 'Redação da newsletter de tecnologia.',
    checklist: []
  }
];

export const INITIAL_AGENCY_SETTINGS: AgencySettings = {
  name: 'SocialFlow',
  logo: '',
  contactEmail: 'contato@agencia.com',
  primaryColor: '#4f46e5',
  secondaryColor: '#818cf8',
  tertiaryColor: '#c7d2fe'
};
