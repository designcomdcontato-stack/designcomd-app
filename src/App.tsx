/**
 * Agência Digital - Design com D. - Applet version 1.0.1
 */
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, Header } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { Planning } from './components/Planning';
import { PostModal } from './components/PostModal';
import { EditorialLine } from './components/EditorialLine';
import { FollowerDiary } from './components/FollowerDiary';
import { MetricsPage } from './components/MetricsPage';
import { ImportPage } from './components/ImportPage';
import { FeedView } from './components/FeedView';
import { CalendarView } from './components/CalendarView';
import { ProfilesPage } from './components/ProfilesPage';
import { TeamPage } from './components/TeamPage';
import { SettingsPage } from './components/SettingsPage';
import { FilesPage } from './components/FilesPage';
import { TasksPage } from './components/TasksPage';
import { FinancePage } from './components/FinancePage';
import { AdditionalDatesPage } from './components/AdditionalDatesPage';
import { ClientModal } from './components/ClientModal';
import { LoginPage } from './components/LoginPage';
import { SecurityPrompt } from './components/SecurityPrompt';
import { Client, Post, TeamMember, EditorialItem, AgencySettings, CommemorativeDate, Task, FinancialReport } from './types';
import { getAutomaticCommemorativeDates } from './lib/holidayUtils';
import { INITIAL_CLIENTS, INITIAL_POSTS, INITIAL_TEAM, INITIAL_TASKS, INITIAL_AGENCY_SETTINGS } from './data/initialData';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, Plus } from 'lucide-react';
import { cn } from './lib/utils';
import { Toaster, toast } from 'sonner';
import { supabaseService, isUUID } from './services/supabaseService';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [userPassword, setUserPassword] = useState<string>('');
  const [pendingClient, setPendingClient] = useState<Client | null>(null);
  const [pendingTab, setPendingTab] = useState<string | null>(null);
  const [isSecurityPromptOpen, setIsSecurityPromptOpen] = useState(false);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isClientSwitchUnlocked, setIsClientSwitchUnlocked] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClient, setActiveClient] = useState<Client | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [financialReports, setFinancialReports] = useState<FinancialReport[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // Permission management
  const isAdmin = user?.email === 'designcomd.contato@gmail.com' || user?.email?.endsWith('@agencia.com');
  const canSwitchClient = isAdmin;

  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [agencySettings, setAgencySettings] = useState<AgencySettings>(INITIAL_AGENCY_SETTINGS);

  const [isLoading, setIsLoading] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const isInitialAuthChecked = useRef(false);

  useEffect(() => {
    // Check current session on mount
    const initAuth = async () => {
      try {
        const { session } = await supabaseService.getSession();
        if (session?.user?.email) {
          const authorized = await supabaseService.isAuthorized(session.user.email);
          if (authorized) {
            setUser({ email: session.user.email });
            setIsAuthenticated(true);
          } else {
            console.warn('App: User not authorized, logging out');
            await supabaseService.logout();
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (err: any) {
        console.error('Auth initialization error:', err);
        // If it's a refresh token error, we're essentially signed out
        if (err.message?.includes('Refresh Token') || err.message?.includes('invalid_grant')) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } finally {
        setIsAuthChecking(false);
        isInitialAuthChecked.current = true;
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabaseService.onAuthStateChange(async (event, session) => {
      if (!isInitialAuthChecked.current) return;

      if (event === 'SIGNED_IN' && session?.user?.email) {
        // Only handle if not already authenticated to avoid loops
        if (isAuthenticated && user?.email === session.user.email) return;

        const authorized = await supabaseService.isAuthorized(session.user.email);
        if (authorized) {
          setUser({ email: session.user.email });
          setIsAuthenticated(true);
        } else {
          await supabaseService.logout();
          toast.error('Acesso não autorizado.');
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setUser(null);
        setUserPassword('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchData = async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoading(true);
      console.log('App: Fetching initial data from Supabase...');
      const [dbClients, dbSettings, dbTeam] = await Promise.all([
        supabaseService.getClients().catch((err) => { console.error('Clients fetch error:', err); return []; }),
        supabaseService.getAgencySettings().catch((err) => { console.error('Settings fetch error:', err); return null; }),
        supabaseService.getTeamMembers().catch((err) => { console.error('Team fetch error:', err); return []; })
      ]);

      const finalClients = (dbClients || []).length > 0 ? dbClients : INITIAL_CLIENTS;
      console.log(`App: Loaded ${finalClients.length} clients (${(dbClients || []).length > 0 ? 'DB' : 'Fallback'}).`);
      setClients(finalClients);
      
      if (dbSettings) {
        setAgencySettings(dbSettings);
      } else {
        setAgencySettings(INITIAL_AGENCY_SETTINGS);
      }

      const finalTeam = (dbTeam || []).length > 0 ? dbTeam : INITIAL_TEAM;
      setTeam(finalTeam);

      // Auto-select preferred client from Agency Settings, otherwise first database client
      if (finalClients.length > 0) {
        const preferredClientId = dbSettings?.preferredClientId;
        const preferredClient = finalClients.find(c => c.id === preferredClientId);
        handleSetActiveClient(preferredClient || finalClients[0]);
      } else {
        setActiveClient(null);
        setPosts(INITIAL_POSTS);
        setTasks(INITIAL_TASKS);
        setFinancialReports([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    document.documentElement.style.setProperty('--brand-primary', agencySettings.primaryColor);
    document.documentElement.style.setProperty('--brand-secondary', agencySettings.secondaryColor);
    document.documentElement.style.setProperty('--brand-tertiary', agencySettings.tertiaryColor);
  }, [agencySettings.primaryColor, agencySettings.secondaryColor, agencySettings.tertiaryColor]);
  
  const [commemorativeDates, setCommemorativeDates] = useState<CommemorativeDate[]>(() => {
    const currentYear = new Date().getFullYear();
    return getAutomaticCommemorativeDates(currentYear);
  });
  
  const handleAddCommemorativeDate = async (date: CommemorativeDate) => {
    if (!activeClient) {
      toast.error('Selecione um cliente primeiro.');
      return;
    }
    try {
      const savedDate = await supabaseService.saveCommemorativeDate(activeClient.id, date);
      setCommemorativeDates(prev => [...prev, savedDate]);
      toast.success('Data comemorativa adicionada');
    } catch (err: any) {
      console.error('Error saving date:', err);
      toast.error(`Erro ao salvar data: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const handleAddMultipleCommemorativeDates = async (newDates: CommemorativeDate[]) => {
    if (!activeClient) {
      toast.error('Selecione um cliente primeiro.');
      return;
    }
    try {
      const savedDates = await Promise.all(newDates.map(d => supabaseService.saveCommemorativeDate(activeClient!.id, d)));
      setCommemorativeDates(prev => [...prev, ...savedDates]);
      toast.success(`${newDates.length} datas adicionadas`);
    } catch (err: any) {
      console.error('Error saving multiple dates:', err);
      toast.error(`Erro ao salvar datas: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const handleUpdateCommemorativeDate = async (date: CommemorativeDate) => {
    if (!activeClient) return;
    try {
      const savedDate = await supabaseService.saveCommemorativeDate(activeClient.id, date);
      setCommemorativeDates(prev => prev.map(d => d.id === date.id ? savedDate : d));
      toast.success('Data atualizada');
    } catch (err: any) {
      console.error('Error updating date:', err);
      toast.error(`Erro ao atualizar data: ${err.message || 'Erro desconhecido'}`);
    }
  };

  const handleDeleteCommemorativeDate = async (id: string) => {
    try {
      await supabaseService.deleteCommemorativeDate(id);
      setCommemorativeDates(prev => prev.filter(d => d.id !== id));
      toast.success('Data removida');
    } catch (err: any) {
      console.error('Error deleting date:', err);
      toast.error(`Erro ao remover data: ${err.message || 'Erro desconhecido'}`);
    }
  };
  
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Update active client when list changes or selection happens
  const handleSetActiveClient = async (client: Client | null | undefined) => {
    if (!client || !client.id) {
      setActiveClient(null);
      setPosts([]);
      setTasks([]);
      setFinancialReports([]);
      const currentYear = new Date().getFullYear();
      const automaticDates = getAutomaticCommemorativeDates(currentYear);
      
      // Fetch only global dates when no client
      supabaseService.getCommemorativeDates().then(dbDates => {
        setCommemorativeDates([...automaticDates, ...dbDates]);
      }).catch(() => {
        setCommemorativeDates(automaticDates);
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log(`App: Loading full details for client ${client.name}...`);
      
      // Fetch separate table data filtered by client_id
      const [editorial, diary, files, dbPosts, dbTasks, dbDates, dbReports] = await Promise.all([
        supabaseService.getEditorialLine(client.id).catch(err => { console.error('Editorial fetch error:', err); return []; }),
        supabaseService.getDiaryEntries(client.id).catch(err => { console.error('Diary fetch error:', err); return []; }),
        supabaseService.getFiles(client.id).catch(err => { console.error('Files fetch error:', err); return []; }),
        supabaseService.getPosts(client.id).catch(err => { console.error('Posts fetch error:', err); return []; }),
        supabaseService.getTasks(client.id).catch(err => { console.error('Tasks fetch error:', err); return []; }),
        supabaseService.getCommemorativeDates(client.id).catch(err => { console.error('Dates fetch error:', err); return []; }),
        supabaseService.getFinancialReports(client.id).catch(err => { console.error('Reports fetch error:', err); return []; })
      ]);
      
      // Update global states filtered by client
      setPosts(dbPosts || []);
      setTasks(dbTasks || []);
      setFinancialReports(dbReports || []);
      
      const currentYear = new Date().getFullYear();
      const automaticDates = getAutomaticCommemorativeDates(currentYear);
      setCommemorativeDates([...automaticDates, ...(dbDates || [])]);

      const fullClient = {
        ...client,
        editorialLine: (editorial || []).length > 0 ? editorial : client.editorialLine,
        followerHistory: (diary || []).length > 0 ? diary : client.followerHistory,
        assets: (files || []).length > 0 ? files : (client.assets || [])
      };

      setActiveClient(fullClient);
      
      // Also update in the clients list
      setClients(prev => prev.map(c => c.id === client.id ? fullClient : c));
      
      setIsClientSwitchUnlocked(false);
      toast.success(`Cliente carregado: ${client.name}`);
    } catch (err) {
      console.error('Error loading client details:', err);
      setActiveClient(client);
      toast.error('Erro ao carregar detalhes do cliente do Supabase');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlockRequest = () => {
    setPendingClient(null);
    setPendingTab(null);
    setIsSecurityPromptOpen(true);
  };

  const handleSetActiveTab = (tab: string) => {
    if (tab === 'profiles') {
      setPendingTab(tab);
      setPendingClient(null);
      setIsSecurityPromptOpen(true);
    } else {
      setActiveTab(tab);
      setIsClientSwitchUnlocked(false);
    }
  };

  const confirmSwitch = () => {
    if (pendingClient) {
      handleSetActiveClient(pendingClient);
      setPendingClient(null);
      setIsSecurityPromptOpen(false);
      toast.success(`Acesso concedido: ${pendingClient.name}`);
    } else if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
      setIsSecurityPromptOpen(false);
      toast.success('Acesso concedido à aba de Perfis');
    } else {
      setIsClientSwitchUnlocked(true);
      setIsSecurityPromptOpen(false);
      toast.success('Seletor de clientes desbloqueado');
    }
  };

  const handleVerifyPassword = async (password: string): Promise<boolean> => {
    // If we have a password cached and it matches, let it through
    if (userPassword && password === userPassword) {
      return true;
    }
    
    // Otherwise, do a live Supabase verify credentials call
    if (user?.email) {
      try {
        console.log('App: Verifying re-authorization credentials with Supabase...');
        const data = await supabaseService.verifyCredentials(user.email, password);
        if (data?.user?.email) {
          // Cache correct password
          setUserPassword(password);
          return true;
        }
      } catch (err) {
        console.warn('App: Credential re-verification failed:', err);
      }
    }
    return false;
  };

  const handleUpdateEditorial = async (items: EditorialItem[]) => {
    if (!activeClient) return;
    try {
      console.log('App: Saving editorial line to separate table...');
      const savedItems = await supabaseService.saveEditorialLine(activeClient.id, items);
      
      const updatedClient = { ...activeClient, editorialLine: savedItems };
      setActiveClient(updatedClient);
      setClients(prev => prev.map(c => c.id === activeClient.id ? updatedClient : c));
      
      toast.success('Linha editorial salva no Supabase (editorial_lines)');
    } catch (err: any) {
      console.error('Error saving editorial line:', err);
      toast.error('Erro no Supabase: ' + (err.message || 'Erro desconhecido ao salvar editorial'));
    }
  };

  const handleDeleteEditorialItem = async (id: string) => {
    if (!activeClient) return;
    
    console.log(`App: Attempting to delete editorial item ${id} for client ${activeClient.id}`);
    
    if (!id || (!isUUID(id) && typeof id === 'string' && id.includes('temp-'))) {
      toast.error('Não foi possível excluir: item sem ID válido.');
      return;
    }

    try {
      setIsLoading(true);
      await supabaseService.deleteEditorialItem(id);
      
      console.log('App: Delete successful, refreshing list...');
      // Refresh the list from Supabase
      const updatedItems = await supabaseService.getEditorialLine(activeClient.id);
      
      const updatedClient = { ...activeClient, editorialLine: updatedItems };
      setActiveClient(updatedClient);
      setClients(prev => prev.map(c => c.id === activeClient.id ? updatedClient : c));
      
      toast.success('Pilar da linha editorial excluído com sucesso');
    } catch (err: any) {
      console.error('App: Real delete failed:', err);
      toast.error('Erro ao excluir do Supabase: ' + (err.message || 'Erro desconhecido'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFollowers = async (history: { date: string; count: number }[]) => {
    if (!activeClient) return;
    try {
      console.log('App: Saving follower history to separate table...');
      await supabaseService.saveDiaryEntries(activeClient.id, history);
      
      // Refresh history from Supabase to get the exact data stored
      const updatedHistory = await supabaseService.getDiaryEntries(activeClient.id);
      
      const updatedClient = { ...activeClient, followerHistory: updatedHistory };
      setActiveClient(updatedClient);
      setClients(prev => prev.map(c => c.id === activeClient.id ? updatedClient : c));
      
      toast.success('Diário de seguidores atualizado com sucesso');
    } catch (err: any) {
      console.error('App: Error saving follower history:', err);
      toast.error('Erro ao salvar histórico no Supabase: ' + (err.message || 'Erro desconhecido'));
      throw err;
    }
  };

  const handleDeleteDiaryEntry = async (date: string) => {
    if (!activeClient) return;
    try {
      setIsLoading(true);
      await supabaseService.deleteDiaryEntryByDate(activeClient.id, date);
      
      // Refresh history
      const updatedHistory = await supabaseService.getDiaryEntries(activeClient.id);
      
      const updatedClient = { ...activeClient, followerHistory: updatedHistory };
      setActiveClient(updatedClient);
      setClients(prev => prev.map(c => c.id === activeClient.id ? updatedClient : c));
      
      toast.success('Registro excluído com sucesso');
    } catch (err: any) {
      console.error('App: Error deleting diary entry:', err);
      toast.error('Erro ao excluir registro: ' + (err.message || 'Erro desconhecido'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSavePost = async (updatedPost: Post) => {
    try {
      console.log('App: Saving post to Supabase...', updatedPost.title);
      const savedPost = await supabaseService.savePost(updatedPost);
      
      // Also save metrics to separate table if they exist
      if (updatedPost.metrics) {
        try {
          console.log('App: Syncing post metrics to table "post_metrics"...');
          await supabaseService.savePostMetrics(savedPost.id, updatedPost.metrics);
        } catch (metricErr) {
          console.warn('App: Post saved but metrics table sync failed:', metricErr);
          // Don't fail the whole operation if just metrics table fails, 
          // as the JSONB column in "posts" was already updated in savePost
        }
      }

      const updatedPostsList = [...posts];
      const index = updatedPostsList.findIndex(p => p.id === (updatedPost.id || savedPost.id));
      
      if (index !== -1) {
        updatedPostsList[index] = savedPost;
      } else {
        updatedPostsList.push(savedPost);
      }
      
      // Sort by date descending
      updatedPostsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setPosts(updatedPostsList);
      toast.success('Post e métricas salvos com sucesso');
    } catch (err: any) {
      console.error('App ERROR: Failed to save post to Supabase.', err);
      toast.error('Erro ao salvar post: ' + (err.message || 'Erro no Supabase'));
    }
  };

  const handleSaveClient = async (client: Client) => {
    try {
      console.log('App: Saving client and its related data...');
      const savedClient = await supabaseService.saveClient(client);
      
      // If there are assets, save them to the files table and remove deleted ones
      if (client.assets) {
        console.log('App: Syncing files to separate table...');
        const existingFiles = await supabaseService.getFiles(savedClient.id);
        
        // Save/Update current assets
        await Promise.all(client.assets.map(asset => 
          supabaseService.saveFile(savedClient.id, asset)
        ));

        // Delete those not in the new list
        const currentIds = client.assets.map(a => a.id).filter(id => id && isUUID(id));
        const toDelete = (existingFiles || []).filter(f => !currentIds.includes(f.id));
        
        await Promise.all(toDelete.map(f => supabaseService.deleteFile(f.id)));
      }

      // Re-fetch to get IDs and updated state for the saved client
      const [editorial, diary, files, dbPosts, dbTasks, dbDates, dbReports] = await Promise.all([
        supabaseService.getEditorialLine(savedClient.id),
        supabaseService.getDiaryEntries(savedClient.id),
        supabaseService.getFiles(savedClient.id),
        supabaseService.getPosts(savedClient.id),
        supabaseService.getTasks(savedClient.id),
        supabaseService.getCommemorativeDates(savedClient.id),
        supabaseService.getFinancialReports(savedClient.id)
      ]);

      // If the saved client is the active one, update the global lists too
      if (activeClient?.id === savedClient.id) {
        setPosts(dbPosts || []);
        setTasks(dbTasks || []);
        setFinancialReports(dbReports || []);
        
        const currentYear = new Date().getFullYear();
        const automaticDates = getAutomaticCommemorativeDates(currentYear);
        setCommemorativeDates([...automaticDates, ...(dbDates || [])]);
      }

      const fullClient = {
        ...savedClient,
        editorialLine: (editorial || []).length > 0 ? editorial : savedClient.editorialLine,
        followerHistory: (diary || []).length > 0 ? diary : savedClient.followerHistory,
        assets: (files || []).length > 0 ? files : (savedClient.assets || [])
      };

      const exists = clients.find(c => c.id === client.id || c.id === savedClient.id);
      if (exists) {
        setClients(clients.map(c => (c.id === client.id || c.id === savedClient.id) ? fullClient : c));
        if (activeClient?.id === client.id || activeClient?.id === savedClient.id) {
          setActiveClient(fullClient);
        }
      } else {
        setClients([...clients, fullClient]);
        if (!activeClient) {
          setActiveClient(fullClient);
        }
      }
      setIsClientModalOpen(false);
      setEditingClient(null);
      toast.success('Cliente e arquivos persistidos no Supabase');
    } catch (err: any) {
      console.error('Error saving client:', err);
      toast.error('Erro ao salvar cliente no Supabase: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      await supabaseService.deleteClient(clientId);
      const updatedClients = clients.filter(c => c.id !== clientId);
      setClients(updatedClients);
      if (activeClient?.id === clientId) {
        setActiveClient(updatedClients[0] || null);
      }
      toast.success('Cliente excluído com sucesso');
    } catch (err) {
      console.error('Error deleting client:', err);
      toast.error('Erro ao excluir cliente');
    }
  };

  const handleAddTeamMember = async (member: TeamMember) => {
    try {
      setIsLoading(true);
      await supabaseService.saveTeamMember(member);
      const members = await supabaseService.getTeamMembers();
      setTeam(members);
      toast.success('Membro da equipe adicionado com sucesso');
    } catch (err: any) {
      console.error('App ERROR: Failed to add team member:', err);
      toast.error('Erro ao adicionar membro: ' + (err.message || 'Erro no Supabase'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTeamMember = async (member: TeamMember) => {
    try {
      setIsLoading(true);
      await supabaseService.saveTeamMember(member);
      const members = await supabaseService.getTeamMembers();
      setTeam(members);
      toast.success('Equipe atualizada com sucesso');
    } catch (err: any) {
      console.error('App ERROR: Failed to update team member:', err);
      toast.error('Erro ao atualizar equipe: ' + (err.message || 'Erro no Supabase'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      // Step 0: Ensure any previous stale session is cleared
      try {
        await supabaseService.logout();
      } catch (e) {
        // Ignore logout errors during pre-login cleanup
      }

      // Step 1: Real authentication with Supabase
      const { user: supabaseUser } = await supabaseService.login(email, password);
      
      if (!supabaseUser?.email) {
        throw new Error('E-mail ou senha incorretos.');
      }

      // Step 2: Check authorization with a timeout
      const authorizedPromise = supabaseService.isAuthorized(supabaseUser.email);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('A verificação de autorização demorou muito.')), 8000)
      );

      const authorized = await Promise.race([authorizedPromise, timeoutPromise]) as boolean;
      
      if (!authorized) {
        supabaseService.logout().catch(() => {}); 
        throw new Error('Sua conta não tem permissão para acessar este sistema.');
      }

      // Success
      setUser({ email: supabaseUser.email });
      setIsAuthenticated(true);
      setUserPassword(password);
      toast.success('Login realizado com sucesso!');
    } catch (err: any) {
      console.error('Login error details:', err);
      const isInvalidCredentials = 
        err.message === 'Invalid login credentials' || 
        err.message?.includes('Invalid login credentials') ||
        err.message?.includes('invalid_grant');

      if (isInvalidCredentials) {
        throw new Error('E-mail ou senha incorretos. Verifique suas credenciais no painel do Supabase.');
      }
      throw err;
    }
  };

  const handleLogout = async () => {
    try {
      await supabaseService.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsClientSwitchUnlocked(false);
      setIsAuthenticated(false);
      setUser(null);
      setUserPassword('');
      toast.info('Você saiu da sua conta.');
    }
  };

  const handleToggleFavorite = async (clientId: string) => {
    try {
      const client = clients.find(c => c.id === clientId);
      if (!client) return;

      // Toggle logic: if already preferred, remove. If not, set as preferred.
      const isCurrentlyPreferred = agencySettings.preferredClientId === clientId;
      
      const newSettings = {
        ...agencySettings,
        preferredClientId: isCurrentlyPreferred ? undefined : clientId,
        preferredClientName: isCurrentlyPreferred ? undefined : client.name
      };

      setAgencySettings(newSettings);
      await supabaseService.saveAgencySettings(newSettings);
      
      toast.success(isCurrentlyPreferred ? 'Preferência removida' : `Perfil "${client.name}" definido como preferido`);
    } catch (err) {
      console.error('Error toggling favorite:', err);
      toast.error('Erro ao salvar preferência no Supabase');
      // Refresh settings to sync back
      const dbSettings = await supabaseService.getAgencySettings();
      if (dbSettings) setAgencySettings(dbSettings);
    }
  };

  const handleDeleteTeamMember = async (id: string) => {
    if ((team || []).length <= 1) {
      toast.error("Você precisa de pelo menos um membro na equipe.");
      return;
    }
    
    try {
      setIsLoading(true);
      await supabaseService.deleteTeamMember(id);
      const members = await supabaseService.getTeamMembers();
      setTeam(members);
      toast.success('Membro da equipe removido com sucesso');
    } catch (err: any) {
      console.error('App ERROR: Failed to delete team member:', err);
      toast.error('Erro ao remover membro: ' + (err.message || 'Erro no Supabase'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await supabaseService.deletePost(postId);
      setPosts(posts.filter(p => p.id !== postId));
      setSelectedPost(null);
      toast.success('Post excluído com sucesso');
    } catch (err) {
      console.error('Error deleting post:', err);
      toast.error('Erro ao excluir post');
    }
  };

  const handleAddFinancialReport = async (report: FinancialReport) => {
    try {
      const savedReport = await supabaseService.saveFinancialReport(report);
      setFinancialReports(prev => [...prev, savedReport]);
      toast.success('Relatório financeiro adicionado');
    } catch (err) {
      console.error('Error saving financial report:', err);
      toast.error('Erro ao salvar relatório financeiro');
    }
  };

  const handleUpdateFinancialReport = async (updatedReport: FinancialReport) => {
    try {
      const savedReport = await supabaseService.saveFinancialReport(updatedReport);
      setFinancialReports(prev => prev.map(r => r.id === updatedReport.id ? savedReport : r));
      toast.success('Relatório financeiro atualizado');
    } catch (err) {
      console.error('Error updating financial report:', err);
      toast.error('Erro ao atualizar relatório financeiro');
    }
  };

  const handleDeleteFinancialReport = async (id: string) => {
    try {
      await supabaseService.deleteFinancialReport(id);
      setFinancialReports(prev => prev.filter(r => r.id !== id));
      toast.success('Relatório financeiro excluído');
    } catch (err) {
      console.error('Error deleting financial report:', err);
      toast.error('Erro ao excluir relatório financeiro');
    }
  };

  const handleCreatePost = async () => {
    if (!activeClient) {
      toast.error("Selecione ou cadastre um cliente primeiro na aba Perfis.");
      return;
    }

    if (!isUUID(activeClient.id)) {
      toast.error("Erro: O cliente selecionado não possui um ID válido. Salve-o novamente na aba Perfis.");
      return;
    }

    // Logic for suggesting a responsible automatically
    const socialMediaMembers = team.filter(m => 
      (m.role === 'Social Media' || m.role === 'Social Midia') && 
      m.status === 'Ativo'
    );
    
    let defaultResponsible = '';
    let defaultResponsibleId = undefined;
    
    if ((socialMediaMembers || []).length > 0) {
      const suggested = socialMediaMembers[(socialMediaMembers || []).length - 1]; // Most recent
      defaultResponsible = suggested.name;
      defaultResponsibleId = suggested.id;
    }

    const newPost: Post = {
      id: '', // Empty means create
      clientId: activeClient.id,
      title: 'Novo Post',
      date: new Date().toISOString().split('T')[0],
      status: 'Ideia',
      channels: [activeClient.socialMedia[0] || 'Instagram'],
      format: 'Estático',
      editorialItemId: activeClient.editorialLine[0]?.id || '',
      description: '',
      responsible: defaultResponsible,
      responsibleId: defaultResponsibleId,
      checklist: [],
      comments: [],
      metrics: { reach: 0, plays: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    };
    
    try {
      setIsLoading(true);
      console.log('App: Creating post for client:', activeClient.name);
      const savedPost = await supabaseService.savePost(newPost);
      
      const newPostsList = [...posts, savedPost];
      // Sort by date descending
      newPostsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setPosts(newPostsList);
      setSelectedPost(savedPost);
      toast.success('Novo post criado com sucesso!');
    } catch (err: any) {
      console.error('App: Error in handleCreatePost:', err);
      toast.error('Falha ao criar post: ' + (err.message || 'Erro no Supabase'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportPosts = async (newPosts: Post[]) => {
    try {
      await supabaseService.savePosts(newPosts);
      // Reload posts for current client from Supabase to ensure everything is in sync
      const clientPosts = activeClient?.id ? await supabaseService.getPosts(activeClient.id) : [];
      setPosts(clientPosts);
      setActiveTab('planning');
      toast.success(`${newPosts.length} posts importados e salvos no Supabase.`);
    } catch (err) {
      console.error('Error importing posts:', err);
      toast.error('Erro ao salvar posts no banco de dados. Verifique o console para mais detalhes.');
    }
  };

  const handleUpdateSettings = async (newSettings: AgencySettings) => {
    try {
      const savedSettings = await supabaseService.saveAgencySettings(newSettings);
      setAgencySettings(savedSettings);
      toast.success('Configurações salvas');
    } catch (err) {
      console.error('Error saving settings:', err);
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleAddTask = async (task: Task) => {
    try {
      console.log('App: Adding task to Supabase...');
      const savedTask = await supabaseService.saveTask(task);
      setTasks([...tasks, savedTask]);
      toast.success('Tarefa salva no Supabase');
    } catch (err: any) {
      console.error('Error adding task:', err);
      toast.error('Erro no Supabase: ' + (err.message || 'Verifique se o cliente está cadastrado no banco.'));
    }
  };

  const handleUpdateTask = async (updatedTask: Task) => {
    try {
      console.log('App: Updating task in Supabase...');
      const savedTask = await supabaseService.saveTask(updatedTask);
      setTasks(tasks.map(t => t.id === updatedTask.id ? savedTask : t));
      toast.success('Tarefa atualizada no Supabase');
    } catch (err: any) {
      console.error('Error updating task:', err);
      toast.error('Erro ao atualizar no Supabase: ' + (err.message || 'Erro desconhecido'));
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!id) {
      toast.error('Não foi possível excluir: tarefa sem ID.');
      return;
    }

    try {
      setIsLoading(true);
      console.log('App: Deleting task with ID:', id);
      await supabaseService.deleteTask(id);
      
      // Update local state first for immediate UI response
      setTasks(tasks.filter(t => t.id !== id));
      
      // Refresh from Supabase as requested to ensure sync
      if (activeClient?.id) {
        const updatedTasks = await supabaseService.getTasks(activeClient.id);
        setTasks(updatedTasks);
      }
      
      toast.success('Tarefa excluída com sucesso');
    } catch (err: any) {
      console.error('App: Error deleting task:', err);
      toast.error('Erro ao excluir tarefa: ' + (err.message || 'Erro no Supabase'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (!activeClient && activeTab !== 'profiles' && activeTab !== 'team' && activeTab !== 'settings') {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <div className="w-20 h-20 bg-brand/10 text-brand rounded-3xl flex items-center justify-center mb-6">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Nenhum Cliente Ativo</h2>
          <p className="text-slate-500 max-w-md mb-8">
            Você ainda não possui clientes cadastrados ou não selecionou um cliente para visualizar os dados.
          </p>
          <button
            onClick={() => {
              setActiveTab('profiles');
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
            className="flex items-center gap-2 bg-brand hover:opacity-90 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-brand/10"
          >
            <Plus size={20} />
            Cadastrar Primeiro Cliente
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            client={activeClient as Client} 
            posts={posts} 
            tasks={tasks}
            commemorativeDates={commemorativeDates}
            onNavigate={setActiveTab}
            agencySettings={agencySettings}
          />
        );
      case 'planning':
        return (
          <Planning 
            client={activeClient as Client} 
            posts={posts} 
            onAddPost={handleCreatePost} 
            onEditPost={setSelectedPost} 
          />
        );
      case 'feed':
        return <FeedView client={activeClient as Client} posts={posts} onEditPost={setSelectedPost} onUpdateClient={handleSaveClient} />;
      case 'calendar':
        return (
          <CalendarView 
            client={activeClient as Client} 
            posts={posts} 
            tasks={tasks}
            commemorativeDates={commemorativeDates}
            onEditPost={setSelectedPost}
            onAddPost={handleSavePost}
            onAddCommemorativeDate={handleAddCommemorativeDate}
          />
        );
      case 'editorial':
        return (
          <EditorialLine 
            client={activeClient as Client} 
            onUpdate={handleUpdateEditorial} 
            onDelete={handleDeleteEditorialItem}
          />
        );
      case 'diary':
        return (
          <FollowerDiary 
            client={activeClient as Client} 
            onUpdate={handleUpdateFollowers} 
            onDeleteEntry={handleDeleteDiaryEntry}
          />
        );
      case 'metrics':
        return <MetricsPage client={activeClient as Client} posts={posts} agencySettings={agencySettings} />;
      case 'import':
        return (
          <ImportPage 
            client={activeClient as Client} 
            team={team} 
            onImport={handleImportPosts} 
          />
        );
      case 'profiles':
        return (
          <ProfilesPage 
            clients={clients} 
            agencySettings={agencySettings}
            activeClientId={activeClient?.id}
            onAddClient={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }} 
            onEditClient={(client) => {
              setEditingClient(client);
              setIsClientModalOpen(true);
            }} 
            onDeleteClient={handleDeleteClient}
            onToggleFavorite={handleToggleFavorite}
            onSelectClient={handleSetActiveClient}
          />
        );
      case 'team':
        return (
          <TeamPage 
            team={team} 
            onAddMember={handleAddTeamMember}
            onUpdateMember={handleUpdateTeamMember}
            onDeleteMember={handleDeleteTeamMember}
          />
        );
      case 'settings':
        return (
          <SettingsPage 
            settings={agencySettings} 
            onUpdate={handleUpdateSettings} 
            onUpdatePassword={(newPassword) => setUserPassword(newPassword)}
            currentUserPassword={userPassword}
            userEmail={user?.email}
            isAdmin={isAdmin}
          />
        );
      case 'tasks':
        return (
          <TasksPage 
            client={activeClient as Client}
            tasks={tasks}
            setTasks={setTasks}
            team={team}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onRefresh={() => handleSetActiveClient(activeClient)}
          />
        );
      case 'additional-dates':
        return (
          <AdditionalDatesPage 
            activeClient={activeClient}
            dates={commemorativeDates}
            onAddDate={handleAddCommemorativeDate}
            onAddDates={handleAddMultipleCommemorativeDates}
            onUpdateDate={handleUpdateCommemorativeDate}
            onDeleteDate={handleDeleteCommemorativeDate}
          />
        );
      case 'finance':
        return (
          <FinancePage
            activeClient={activeClient}
            reports={financialReports}
            isAdmin={isAdmin}
            onAddReport={handleAddFinancialReport}
            onUpdateReport={handleUpdateFinancialReport}
            onDeleteReport={handleDeleteFinancialReport}
            agencySettings={agencySettings}
          />
        );
      case 'files':
        return <FilesPage client={activeClient as Client} onUpdateClient={handleSaveClient} />;
      default:
        return (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h2>
            <p className="text-slate-500 mt-2">Esta página está sendo construída.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Toaster position="top-right" expand={true} richColors />
      
      {!isAuthenticated ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <>
          <Sidebar 
            activeTab={activeTab} 
            setActiveTab={handleSetActiveTab} 
            isOpen={isSidebarOpen} 
            setIsOpen={setIsSidebarOpen} 
            isCollapsed={isSidebarCollapsed}
            setIsCollapsed={setIsSidebarCollapsed}
            onLogout={handleLogout}
            agencySettings={agencySettings}
            isAdmin={isAdmin}
          />
          
          <div className={cn(
            "flex flex-col min-h-screen transition-all duration-300",
            isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
          )}>
            <Header 
              clients={clients} 
              activeClient={activeClient} 
              agencySettings={agencySettings}
              setActiveClient={handleSetActiveClient}
              toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              activeTab={activeTab}
              setActiveTab={handleSetActiveTab}
            />
            
            <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab + (activeClient?.id || 'none')}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>

              {isSecurityPromptOpen && (
                <SecurityPrompt 
                  correctPassword={userPassword}
                  targetName={pendingClient ? pendingClient.name : (pendingTab === 'profiles' ? 'Perfis' : 'Seletor de Clientes')}
                  onConfirm={confirmSwitch}
                  onVerifyPassword={handleVerifyPassword}
                  onCancel={() => {
                    setIsSecurityPromptOpen(false);
                    setPendingClient(null);
                    setPendingTab(null);
                  }}
                />
              )}

              {/* Brand Footer */}
              <footer className="mt-auto py-8 px-4 border-t border-slate-200 flex flex-col items-center justify-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                  {agencySettings.logo ? (
                    <img src={agencySettings.logo} alt="" className="w-5 h-5 rounded object-cover grayscale" />
                  ) : (
                    <div className="w-5 h-5 bg-slate-400 rounded flex items-center justify-center text-[8px] text-white font-bold">
                      {agencySettings.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {agencySettings.name}
                  </span>
                </div>
                <p className="text-[9px] text-slate-400 font-medium">Sistema de Gestão de Social Media • v1.0</p>
              </footer>
            </main>

            {selectedPost && activeClient && (
              <PostModal 
                post={selectedPost} 
                client={activeClient} 
                team={team}
                onClose={() => setSelectedPost(null)}
                onSave={handleSavePost}
                onDelete={handleDeletePost}
              />
            )}

            {isClientModalOpen && (
              <ClientModal 
                client={editingClient}
                onClose={() => {
                  setIsClientModalOpen(false);
                  setEditingClient(null);
                }}
                onSave={handleSaveClient}
              />
            )}

            {/* Notifications */}
            <AnimatePresence>
              {notification && (
                <motion.div
                  initial={{ opacity: 0, y: 50, x: '-50%' }}
                  animate={{ opacity: 1, y: 0, x: '-50%' }}
                  exit={{ opacity: 0, y: 20, x: '-50%' }}
                  className="fixed bottom-8 left-1/2 z-[200] flex items-center gap-3 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl min-w-[320px]"
                >
                  <div className={cn(
                    "p-1.5 rounded-lg",
                    notification.type === 'error' ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                  )}>
                    <AlertCircle size={18} />
                  </div>
                  <p className="text-sm font-medium flex-1">{notification.message}</p>
                  <button onClick={() => setNotification(null)} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                    <X size={16} className="text-slate-400" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
