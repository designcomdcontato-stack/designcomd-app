import { supabase } from '../lib/supabaseClient';
import { Client, Post, Task, AgencySettings, FinancialReport, EditorialItem, TeamMember } from '../types';

export const isUUID = (id?: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || '');

const mappers = {
  client: (item: any): Client => ({
    id: item.id,
    name: item.name,
    logo: item.logo || '',
    primaryColor: item.primary_color || '',
    socialMedia: item.social_media || [],
    responsible: item.responsible || '',
    observations: item.observations || '',
    bio: item.bio || '',
    brandVoiceManual: item.brand_voice_manual || '',
    editorialLine: item.editorial_line || [],
    followerHistory: item.follower_history || [],
    brandPalette: item.brand_palette || [],
    brandVoice: {
      tone: (item.brand_voice && Array.isArray(item.brand_voice.tone)) ? item.brand_voice.tone : [],
      audience: (item.brand_voice && Array.isArray(item.brand_voice.audience)) ? item.brand_voice.audience : [],
      productType: (item.brand_voice && Array.isArray(item.brand_voice.productType)) ? item.brand_voice.productType : [],
      customOptions: {
        tone: (item.brand_voice && item.brand_voice.customOptions && Array.isArray(item.brand_voice.customOptions.tone)) ? item.brand_voice.customOptions.tone : [],
        audience: (item.brand_voice && item.brand_voice.customOptions && Array.isArray(item.brand_voice.customOptions.audience)) ? item.brand_voice.customOptions.audience : [],
        productType: (item.brand_voice && item.brand_voice.customOptions && Array.isArray(item.brand_voice.customOptions.productType)) ? item.brand_voice.customOptions.productType : [],
      }
    },
    assets: item.assets || [],
    folders: item.folders || [],
    fixedInfo: item.fixed_info || []
  }),
  post: (item: any): Post => {
    const metrics = item.post_metrics && item.post_metrics[0] ? item.post_metrics[0] : (item.metrics || {});
    return {
      id: item.id,
      clientId: item.client_id,
      title: item.title,
      date: item.date,
      status: item.status as any,
      channels: item.channels || [],
      format: item.format as any,
      editorialItemId: item.editorial_item_id,
      image: item.image,
      description: item.description,
      responsible: item.responsible,
      responsibleId: item.responsible_id,
      checklist: item.checklist || [],
      comments: item.comments || [],
      metrics: {
        reach: metrics.reach || 0,
        plays: metrics.plays || 0,
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        shares: metrics.shares || 0,
        saves: metrics.saves || 0,
        impressions: metrics.impressions || 0
      }
    };
  },
  task: (item: any): Task => ({
    id: item.id,
    clientId: item.client_id,
    title: item.title,
    requester: item.requester,
    deliveryDate: item.delivery_date,
    status: item.status as any,
    responsible: item.responsible,
    responsibleId: item.responsible_id,
    description: item.description,
    checklist: item.checklist || []
  }),
  financialReport: (item: any): FinancialReport => ({
    id: item.id,
    clientId: item.client_id,
    month: item.month,
    title: item.title,
    dueDate: item.due_date,
    items: item.items || [],
    status: item.status as any,
    paymentInfo: item.payment_info || {},
    total: item.total || 0,
    observations: item.observations,
    createdAt: item.created_at
  })
};

export const supabaseService = {
  // Clients
  async getClients(): Promise<Client[]> {
    console.log('Supabase: Fetching all clients...');
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Supabase: Error fetching clients:', error);
      throw error;
    }
    
    console.log(`Supabase: Successfully fetched ${data?.length || 0} clients.`);
    return (data || []).map(mappers.client);
  },

  async saveClient(client: Partial<Client>): Promise<Client> {
    console.log('Supabase: Saving client...', client.name);
    const dbClient: any = {
      name: client.name,
      logo: client.logo,
      primary_color: client.primaryColor,
      social_media: client.socialMedia,
      responsible: client.responsible,
      observations: client.observations,
      bio: client.bio,
      brand_voice_manual: client.brandVoiceManual,
      brand_palette: client.brandPalette,
      brand_voice: client.brandVoice,
      folders: client.folders,
      fixed_info: client.fixedInfo
    };

    if (client.id && isUUID(client.id)) {
      console.log('Supabase: Updating client in table "clients" with ID:', client.id);
      const { data, error } = await supabase
        .from('clients')
        .update(dbClient)
        .eq('id', client.id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error updating client (table: clients, id:', client.id, '):', error);
        throw error;
      }
      return mappers.client(data);
    } else {
      console.log('Supabase: Inserting new client into table "clients"...');
      const { data, error } = await supabase
        .from('clients')
        .insert(dbClient)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error inserting client (table: clients):', error);
        throw error;
      }
      return mappers.client(data);
    }
  },

  async deleteClient(id: string) {
    console.log('Supabase: Deleting client...', id);
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase: Error deleting client:', error);
      throw error;
    }
    
    console.log('Supabase: Client deleted successfully.');
  },

  // Editorial Line (Separate Table)
  async getEditorialLine(clientId: string): Promise<EditorialItem[]> {
    console.log('Supabase: Fetching editorial line for client...', clientId);
    const { data, error } = await supabase
      .from('editorial_lines')
      .select('*')
      .eq('client_id', clientId)
      .order('order');
    
    if (error) {
      console.error('Supabase: Error fetching editorial line:', error);
      return [];
    }
    
    return (data || []).map(item => ({
      id: item.id,
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      subcategory: item.subcategory || '',
      funnelType: item.funnel_type || 'Topo',
      objective: item.objective || '',
      contentType: item.content_type || '',
      frequency: item.frequency || '',
      order: item.order || 0
    }));
  },

  async saveEditorialLine(clientId: string, items: EditorialItem[]): Promise<EditorialItem[]> {
    console.log('Supabase: Saving editorial line for client...', clientId);
    
    try {
      // 0. Verify client exists first to provide better error
      const { data: clientExists, error: checkError } = await supabase
        .from('clients')
        .select('id')
        .eq('id', clientId)
        .maybeSingle();
      
      if (!clientExists) {
        throw new Error(`O cliente (ID: ${clientId}) não foi encontrado no banco de dados. Salve o cliente primeiro na aba Perfis.`);
      }

      // 1. Prepare items for DB
      const toInsert: any[] = [];
      const toUpdate: any[] = [];

      items.forEach(item => {
        const p: any = {
          client_id: clientId,
          title: item.title || '',
          description: item.description || '',
          category: item.category || '',
          subcategory: item.subcategory || '',
          funnel_type: item.funnelType,
          objective: item.objective,
          content_type: item.contentType || '',
          frequency: item.frequency || '',
          order: item.order
        };
        
        // Only include ID if it's a valid UUID AND not a temp one
        if (isUUID(item.id) && !item.id.includes('temp-')) {
          p.id = item.id;
          toUpdate.push(p);
        } else {
          // If no ID or temp ID, it's a new item - omit ID column entirely
          toInsert.push(p);
        }
      });

      // 2. Save current items
      let finalData: any[] = [];

      // Insert new items
      if (toInsert.length > 0) {
        const { data: inserted, error: insertError } = await supabase
          .from('editorial_lines')
          .insert(toInsert)
          .select();
        
        if (insertError) {
          console.error('Supabase: Error inserting new editorial line items:', insertError);
          throw insertError;
        }
        if (inserted) finalData = [...finalData, ...inserted];
      }

      // Update existing items
      if (toUpdate.length > 0) {
        console.log('Supabase: Updating editorial items in table "editorial_lines"...');
        for (const item of toUpdate) {
          const { id, ...updateData } = item;
          const { error: updateError } = await supabase
            .from('editorial_lines')
            .update(updateData)
            .eq('id', id);
          
          if (updateError) {
            console.error('Supabase: Error updating editorial line item (table: editorial_lines, id:', id, '):', updateError);
            throw updateError;
          }
        }
        
        // Fetch updated items to include in finalData
        const { data: updated, error: fetchError } = await supabase
          .from('editorial_lines')
          .select('*')
          .in('id', toUpdate.map(u => u.id));
        
        if (!fetchError && updated) {
          finalData = [...finalData, ...updated];
        }
      }
      
      console.log(`Supabase: Successfully saved ${finalData.length} editorial items.`);
      return finalData.map(item => ({
        id: item.id,
        title: item.title || '',
        description: item.description || '',
        category: item.category || '',
        subcategory: item.subcategory || '',
        funnelType: item.funnel_type || 'Topo',
        objective: item.objective || '',
        contentType: item.content_type || '',
        frequency: item.frequency || '',
        order: item.order || 0
      }));
    } catch (error: any) {
      console.error('Supabase: Critical error in saveEditorialLine:', error);
      throw error;
    }
  },

  async deleteEditorialItem(id: string) {
    console.log('Supabase: Deleting editorial item...', id);
    const { error } = await supabase
      .from('editorial_lines')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase: Error deleting editorial item:', error);
      throw error;
    }
    
    console.log('Supabase: Editorial item deleted successfully.');
  },

  // Diary Entries (Separate Table)
  async getDiaryEntries(clientId: string): Promise<{ date: string; count: number }[]> {
    console.log('Supabase: Fetching diary entries for client...', clientId);
    if (!clientId || !isUUID(clientId)) {
      console.warn('Supabase: getDiaryEntries call with invalid clientId:', clientId);
      return [];
    }

    const { data, error } = await supabase
      .from('diary_entries')
      .select('entry_date, description')
      .eq('client_id', clientId)
      .eq('title', 'Seguidores')
      .eq('category', 'followers')
      .order('entry_date');
    
    if (error) {
      console.error('Supabase: Error fetching diary entries:', error);
      return [];
    }
    
    return (data || []).map(item => ({
      date: item.entry_date,
      count: parseInt(item.description) || 0
    }));
  },

  async saveDiaryEntries(clientId: string, entries: { date: string; count: number }[]): Promise<void> {
    console.log('Supabase: Saving diary entries for client...', clientId);
    
    if (!entries || entries.length === 0) return;

    // Use current request specifics
    const dbEntries = entries.map(entry => ({
      client_id: clientId,
      title: 'Seguidores',
      description: entry.count.toString(),
      entry_date: entry.date,
      category: 'followers',
      responsible: ''
    }));

    for (const item of dbEntries) {
      const { client_id, entry_date, category, ...rest } = item;
      
      // Check if entry exists
      const { data: existing } = await supabase
        .from('diary_entries')
        .select('id')
        .eq('client_id', client_id)
        .eq('entry_date', entry_date)
        .eq('category', category)
        .maybeSingle();

      if (existing) {
        console.log(`Supabase: Updating diary entry for ${entry_date} - ${category} (table: diary_entries)`);
        const { error: updateError } = await supabase
          .from('diary_entries')
          .update(rest)
          .eq('id', existing.id);
        
        if (updateError) {
          console.error(`Supabase: Error updating diary entry (table: diary_entries, id: ${existing.id}):`, updateError);
          throw updateError;
        }
      } else {
        console.log(`Supabase: Inserting new diary entry for ${entry_date} - ${category} (table: diary_entries)`);
        const { error: insertError } = await supabase
          .from('diary_entries')
          .insert(item);
        
        if (insertError) {
          console.error('Supabase: Error inserting diary entry (table: diary_entries):', insertError);
          throw insertError;
        }
      }
    }
    
    console.log(`Supabase: Successfully saved ${dbEntries.length} diary entries.`);
  },

  async deleteDiaryEntryByDate(clientId: string, date: string, title: string = 'Seguidores'): Promise<void> {
    console.log(`Supabase: Deleting diary entry for client ${clientId} on date ${date} with title ${title}...`);
    const { error } = await supabase
      .from('diary_entries')
      .delete()
      .eq('client_id', clientId)
      .eq('entry_date', date)
      .eq('title', title);
    
    if (error) {
      console.error('Supabase: Error deleting diary entry:', error);
      throw error;
    }
    
    console.log('Supabase: Diary entry deleted successfully.');
  },

  // Files (Separate Table)
  async getFiles(clientId: string): Promise<any[]> {
    console.log('Supabase: Fetching files for client...', clientId);
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase: Error fetching files:', error);
      return [];
    }
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name || '',
      url: item.url || '',
      path: item.path || '',
      publicUrl: item.public_url || '',
      type: item.type || '',
      mimeType: item.mime_type || '',
      size: item.size || 0,
      folderId: item.folder_id || '',
      uploadedBy: item.uploaded_by || '',
      createdAt: item.created_at || new Date().toISOString()
    }));
  },

  async uploadFile(bucket: string, path: string, file: File): Promise<string> {
    console.log(`Supabase: Uploading file to ${bucket}/${path}...`);
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (error) {
      console.error('Supabase: Error uploading file:', error);
      throw error;
    }

    console.log('Supabase: File uploaded successfully:', data.path);
    return data.path;
  },

  async saveFile(clientId: string, file: any): Promise<any> {
    console.log('Supabase: Saving file record...', file.name);
    const dbFile: any = {
      client_id: clientId,
      name: file.name,
      url: file.url,
      path: file.path,
      public_url: file.publicUrl,
      type: file.type,
      mime_type: file.mimeType || file.type,
      size: file.size,
      folder_id: file.folderId
    };

    if (file.id && isUUID(file.id)) {
      console.log('Supabase: Updating file record in table "files" with ID:', file.id);
      const { data, error } = await supabase
        .from('files')
        .update(dbFile)
        .eq('id', file.id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error updating file record (table: files, id:', file.id, '):', error);
        throw error;
      }
      
      return {
        id: data.id,
        name: data.name,
        url: data.url,
        path: data.path,
        publicUrl: data.public_url,
        type: data.type,
        mimeType: data.mime_type,
        size: data.size,
        folderId: data.folder_id,
        createdAt: data.created_at
      };
    } else {
      console.log('Supabase: Inserting new file record into table "files"...');
      const { data, error } = await supabase
        .from('files')
        .insert(dbFile)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error inserting file record (table: files):', error);
        throw error;
      }
      
      return {
        id: data.id,
        name: data.name,
        url: data.url,
        path: data.path,
        publicUrl: data.public_url,
        type: data.type,
        mimeType: data.mime_type,
        size: data.size,
        folderId: data.folder_id,
        createdAt: data.created_at
      };
    }
  },

  async deleteFileFromStorage(bucket: string, paths: string | string[]): Promise<void> {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    console.log(`Supabase: Deleting files from bucket "${bucket}" at paths:`, pathArray);
    const { error } = await supabase.storage.from(bucket).remove(pathArray);
    if (error) {
      console.error('Supabase: Error removing files from storage:', error);
      throw error;
    }
    console.log('Supabase: Files removed from storage');
  },

  async deleteFile(id: string) {
    console.log('Supabase: Deleting file record by ID:', id);
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Supabase: Error deleting file record:', error);
      throw error;
    }
  },

  async deleteFilesByFolder(clientId: string, folderId: string) {
    console.log('Supabase: Deleting all files in folder:', folderId);
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('client_id', clientId)
      .eq('folder_id', folderId);
    
    if (error) {
      console.error('Supabase: Error deleting files by folder:', error);
      throw error;
    }
  },

  // Post Metrics (Separate Table)
  async getPostMetrics(postId: string): Promise<any | null> {
    console.log('Supabase: Fetching metrics for post...', postId);
    const { data, error } = await supabase
      .from('post_metrics')
      .select('*')
      .eq('post_id', postId)
      .maybeSingle();
    
    if (error) {
      console.error('Supabase: Error fetching post metrics:', error);
      return null;
    }
    
    return data;
  },

  async savePostMetrics(postId: string, metrics: any): Promise<void> {
    console.log('Supabase: Saving metrics for post...', postId);
    const dbMetrics = {
      post_id: postId,
      reach: metrics.reach || 0,
      plays: metrics.plays || 0,
      likes: metrics.likes || 0,
      comments: metrics.comments || 0,
      shares: metrics.shares || 0,
      saves: metrics.saves || 0,
      impressions: metrics.impressions || 0,
      updated_at: new Date().toISOString()
    };

    const { data: existing } = await supabase
      .from('post_metrics')
      .select('id')
      .eq('post_id', postId)
      .maybeSingle();

    if (existing) {
      console.log('Supabase: Updating metrics for post in table "post_metrics" for post_id:', postId);
      const { error } = await supabase
        .from('post_metrics')
        .update(dbMetrics)
        .eq('id', existing.id);
      
      if (error) {
        console.error('Supabase: Error updating post metrics (table: post_metrics, id:', existing.id, '):', error);
        throw error;
      }
    } else {
      console.log('Supabase: Inserting metrics for post into table "post_metrics" for post_id:', postId);
      const { error } = await supabase
        .from('post_metrics')
        .insert(dbMetrics);
      
      if (error) {
        console.error('Supabase: Error inserting post metrics (table: post_metrics):', error);
        throw error;
      }
    }
  },

  // Posts
  async getPosts(clientId: string): Promise<Post[]> {
    console.log('Supabase: Fetching posts for client...', clientId);
    if (!clientId || !isUUID(clientId)) {
      console.warn('Supabase: getPosts call with invalid clientId:', clientId);
      return [];
    }
    
    const { data, error } = await supabase
      .from('posts')
      .select('*, post_metrics(*)')
      .eq('client_id', clientId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Supabase: Error fetching posts:', error);
      throw error;
    }
    
    console.log(`Supabase: Successfully fetched ${data?.length || 0} posts.`);
    return (data || []).map(mappers.post);
  },

  async savePost(post: Partial<Post>): Promise<Post> {
    console.log('Supabase: Persisting post...', { title: post.title, id: post.id });
    
    // Ensure client_id is a valid UUID
    if (!post.clientId || !isUUID(post.clientId)) {
      console.error('Supabase ERROR: Cannot save post without a valid UUID client_id. Provided:', post.clientId);
      throw new Error('O cliente vinculado a este post não possui um ID válido no banco de dados. Salve o cliente primeiro na aba Perfis.');
    }

    const dbPost: any = {
      client_id: post.clientId,
      title: post.title || 'Novo Post',
      date: post.date || new Date().toISOString().split('T')[0],
      status: post.status || 'Ideia',
      channels: post.channels || [],
      format: post.format || 'Estático',
      editorial_item_id: post.editorialItemId,
      image: post.image,
      description: post.description || '',
      responsible: post.responsible || '',
      checklist: post.checklist || [],
      comments: post.comments || [],
      metrics: post.metrics || { reach: 0, plays: 0, likes: 0, comments: 0, shares: 0, saves: 0 }
    };

    try {
      if (post.id && isUUID(post.id)) {
        console.log('Supabase: Updating existing post (table: posts, id:', post.id, ')');
        const { data, error } = await supabase
          .from('posts')
          .update(dbPost)
          .eq('id', post.id)
          .select('*, post_metrics(*)')
          .single();
        
        if (error) {
          console.error('Supabase: Error in update operation:', error);
          throw error;
        }
        return mappers.post(data);
      } else {
        console.log('Supabase: Inserting brand new post into table "posts"');
        const { data, error } = await supabase
          .from('posts')
          .insert(dbPost)
          .select('*, post_metrics(*)')
          .single();
        
        if (error) {
          console.error('Supabase: Error in insert operation:', error);
          throw error;
        }
        return mappers.post(data);
      }
    } catch (err: any) {
      console.error('Supabase: Critical error in savePost execution:', err);
      // Extract specific Supabase error message if available
      const message = err.message || err.details || 'Falha na comunicação com o banco de dados Supabase';
      throw new Error(message);
    }
  },

  async savePosts(posts: Post[]): Promise<Post[]> {
    console.log(`Supabase: Bulk saving ${posts.length} posts...`);
    
    const dbPosts = posts.filter(post => {
      if (!post.clientId || !isUUID(post.clientId)) {
        console.warn('Supabase: Skipping post in bulk save as it has no valid UUID client_id:', post.title);
        return false;
      }
      return true;
    }).map(post => {
      const p: any = {
        client_id: post.clientId,
        title: post.title,
        date: post.date,
        status: post.status,
        channels: post.channels,
        format: post.format,
        editorial_item_id: post.editorialItemId,
        image: post.image,
        description: post.description,
        responsible: post.responsible,
        checklist: post.checklist,
        comments: post.comments,
        metrics: post.metrics
      };
      
      if (post.id && isUUID(post.id)) {
        p.id = post.id;
      }
      
      return p;
    });

    if (dbPosts.length === 0) {
      console.warn('Supabase: No valid posts to save in bulk.');
      return [];
    }

    const { data, error } = await supabase
      .from('posts')
      .insert(dbPosts)
      .select();
    
    if (error) {
      console.error('Supabase: Error in bulk saving posts:', error);
      throw error;
    }
    
    console.log(`Supabase: Successfully saved ${data?.length || 0} posts.`);
    const savedPosts = (data || []).map(mappers.post);

    // Also save metrics for these posts
    console.log('Supabase: Saving metrics for imported posts...');
    await Promise.all(savedPosts.map(async (savedPost) => {
      const originalPost = posts.find(p => p.title === savedPost.title && p.clientId === savedPost.clientId);
      if (originalPost?.metrics) {
        await supabaseService.savePostMetrics(savedPost.id, originalPost.metrics);
      }
    }));

    return savedPosts;
  },

  async deletePost(id: string) {
    console.log('Supabase: Deleting post...', id);
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase: Error deleting post:', error);
      throw error;
    }
    
    console.log('Supabase: Post deleted successfully.');
  },

  // Tasks
  async getTasks(clientId: string): Promise<Task[]> {
    console.log('Supabase: Fetching tasks for client...', clientId);
    if (!clientId || !isUUID(clientId)) {
      console.warn('Supabase: getTasks call with invalid clientId:', clientId);
      return [];
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('client_id', clientId)
      .order('delivery_date');
    
    if (error) {
      console.error('Supabase: Error fetching tasks:', error);
      throw error;
    }
    
    console.log(`Supabase: Successfully fetched ${data?.length || 0} tasks.`);
    return (data || []).map(mappers.task);
  },

  async deleteTask(id: string) {
    console.log('Supabase: Deleting task...', id);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase: Error deleting task:', error);
      throw error;
    }
    
    console.log('Supabase: Task deleted successfully.');
  },

  async saveTask(task: Partial<Task>): Promise<Task> {
    console.log('Supabase: Saving task...', task.title);
    
    // Ensure client_id is a valid UUID
    if (!task.clientId || !isUUID(task.clientId)) {
      console.error('Supabase ERROR: Cannot save task without a valid UUID client_id. Provided:', task.clientId);
      throw new Error('O cliente vinculado a esta tarefa não possui um ID válido no banco de dados. Salve o cliente primeiro.');
    }

    const dbTask: any = {
      client_id: task.clientId,
      title: task.title,
      requester: task.requester,
      delivery_date: task.deliveryDate,
      status: task.status,
      responsible: task.responsible,
      description: task.description,
      checklist: task.checklist
    };

    if (task.id && isUUID(task.id)) {
      console.log('Supabase: Updating task in table "tasks" with ID:', task.id);
      const { data, error } = await supabase
        .from('tasks')
        .update(dbTask)
        .eq('id', task.id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error updating task (table: tasks, id:', task.id, '):', error);
        throw error;
      }
      return mappers.task(data);
    } else {
      console.log('Supabase: Inserting new task into table "tasks"...');
      const { data, error } = await supabase
        .from('tasks')
        .insert(dbTask)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error inserting task (table: tasks):', error);
        throw error;
      }
      return mappers.task(data);
    }
  },

  // Team Members
  async getTeamMembers(): Promise<TeamMember[]> {
    console.log('Supabase: Fetching all team members...');
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Supabase: Error fetching team members:', error);
      throw error;
    }
    
    return (data || []).map(item => ({
      id: item.id,
      name: item.name,
      role: item.role as any,
      avatar: item.avatar || '',
      email: item.email || '',
      status: (item.status as any) || 'Ativo',
      permission: (item.permission as any) || 'Colaborador'
    }));
  },

  async saveTeamMember(member: Partial<TeamMember>): Promise<TeamMember> {
    const dbMember: any = {
      name: member.name,
      role: member.role,
      avatar: member.avatar,
      email: member.email,
      status: member.status || 'Ativo',
      permission: member.permission || 'Colaborador'
    };

    if (member.id && isUUID(member.id)) {
      console.log('Supabase: Updating team member in table "team_members" with ID:', member.id);
      const { data, error } = await supabase
        .from('team_members')
        .update(dbMember)
        .eq('id', member.id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error updating team member (table: team_members, id:', member.id, '):', error);
        throw error;
      }
      
      return {
        id: data.id,
        name: data.name,
        role: data.role as any,
        avatar: data.avatar || '',
        email: data.email || '',
        status: data.status as any,
        permission: data.permission as any
      };
    } else {
      console.log('Supabase: Inserting new team member into table "team_members"...');
      const { data, error } = await supabase
        .from('team_members')
        .insert(dbMember)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error inserting team member (table: team_members):', error);
        throw error;
      }
      
      return {
        id: data.id,
        name: data.name,
        role: data.role as any,
        avatar: data.avatar || '',
        email: data.email || '',
        status: data.status as any,
        permission: data.permission as any
      };
    }
  },

  async deleteTeamMember(id: string) {
    if (!id || !isUUID(id)) {
      throw new Error('ID do membro inválido ou ausente para exclusão.');
    }

    console.log('Supabase: Deleting team member with ID:', id);
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase: Error deleting team member:', error);
      throw error;
    }
  },

  // Commemorative Dates
  async getCommemorativeDates(clientId?: string): Promise<any[]> {
    console.log('Supabase: Fetching commemorative dates...', clientId ? `for client ${clientId}` : 'global only');
    
    try {
      let query = supabase.from('commemorative_dates').select('*');
      
      if (clientId && isUUID(clientId)) {
        // Query basics: both client and potential globals
        query = query.or(`client_id.eq.${clientId},client_id.is.null`);
      } else {
        // Global only
        query = query.is('client_id', null);
      }
      
      let { data, error } = await query.order('date');
      
      if (error) {
        console.error('Supabase: Error fetching commemorative dates:', error);
        throw error;
      }

      // STRICT ISOLATION: Manual dates, meetings, anniversaries MUST have a valid client_id.
      // If client_id is NULL, it is only allowed if it is a standard system date (automatic).
      const filteredData = (data || []).filter(item => {
        const hasClientId = !!item.client_id;
        const isClientMatch = item.client_id === clientId;
        const isAutomatic = item.type === 'automatic';
        
        // 1. If it belongs to the client, it's always allowed
        if (hasClientId && isClientMatch) return true;
        
        // 2. If it is global (no client_id), it MUST be automatic/system type
        if (!hasClientId && isAutomatic) return true;
        
        // 3. Any other case (leaked manual date with NULL client_id, or other client's data) is rejected
        return false;
      });
      
      return filteredData.map(item => ({
        id: item.id,
        clientId: item.client_id,
        title: item.title,
        date: item.date,
        type: item.type || 'manual',
        category: item.category || 'Data comemorativa',
        description: item.description,
        status: item.status || 'Ideia'
      }));
    } catch (err) {
      console.error('Supabase: Falha ao buscar datas:', err);
      return [];
    }
  },

  async saveCommemorativeDate(clientId: string, date: any) {
    if (!clientId || !isUUID(clientId)) {
      throw new Error('Selecione um cliente primeiro.');
    }

    // Apenas colunas principais para garantir compatibilidade
    const dbDate: any = {
      client_id: clientId,
      title: date.title,
      date: date.date,
      type: date.type || 'manual',
      category: date.category || 'Data comemorativa',
      description: date.description || ''
    };

    // Adiciona status apenas se presente, evitando quebra se a coluna não existir
    if (date.status) {
      dbDate.status = date.status;
    }

    try {
      if (date.id && isUUID(date.id)) {
        console.log('Supabase: Updating commemorative date in table "commemorative_dates" with ID:', date.id);
        const { data, error } = await supabase
          .from('commemorative_dates')
          .update(dbDate)
          .eq('id', date.id)
          .select()
          .single();
        
        if (error) {
          console.error('Supabase Error (update commemorative_dates):', error);
          throw error;
        }
        
        return {
          id: data.id,
          clientId: data.client_id,
          title: data.title,
          date: data.date,
          type: data.type as any,
          category: data.category as any,
          description: data.description,
          status: data.status as any
        };
      } else {
        console.log('Supabase: Inserting new commemorative date into table "commemorative_dates"...');
        const { data, error } = await supabase
          .from('commemorative_dates')
          .insert(dbDate)
          .select()
          .single();
        
        if (error) {
          console.error('Supabase Error (insert commemorative_dates):', error);
          throw error;
        }
        
        return {
          id: data.id,
          clientId: data.client_id,
          title: data.title,
          date: data.date,
          type: data.type as any,
          category: data.category as any,
          description: data.description,
          status: data.status as any
        };
      }
    } catch (err: any) {
      console.error('Erro real ao salvar data no Supabase:', err);
      throw err;
    }
  },

  async deleteCommemorativeDate(id: string) {
    const { error } = await supabase
      .from('commemorative_dates')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Financial Reports
  async getFinancialReports(clientId: string): Promise<FinancialReport[]> {
    if (!clientId || !isUUID(clientId)) {
      return [];
    }
    const { data, error } = await supabase
      .from('financial_reports')
      .select('*')
      .eq('client_id', clientId)
      .order('due_date', { ascending: false });
    if (error) throw error;
    
    return (data || []).map(mappers.financialReport);
  },

  async saveFinancialReport(report: Partial<FinancialReport>): Promise<FinancialReport> {
    const dbReport: any = {
      client_id: report.clientId,
      month: report.month,
      title: report.title,
      due_date: report.dueDate,
      items: report.items,
      status: report.status,
      payment_info: report.paymentInfo,
      total: report.total,
      observations: report.observations
    };

    if (report.id && isUUID(report.id)) {
      console.log('Supabase: Updating financial report in table "financial_reports" with ID:', report.id);
      const { data, error } = await supabase
        .from('financial_reports')
        .update(dbReport)
        .eq('id', report.id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error updating financial report (table: financial_reports, id:', report.id, '):', error);
        throw error;
      }
      return mappers.financialReport(data);
    } else {
      console.log('Supabase: Inserting new financial report into table "financial_reports"...');
      const { data, error } = await supabase
        .from('financial_reports')
        .insert(dbReport)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error inserting financial report (table: financial_reports):', error);
        throw error;
      }
      return mappers.financialReport(data);
    }
  },

  async deleteFinancialReport(id: string) {
    const { error } = await supabase
      .from('financial_reports')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Agency Settings
  async getAgencySettings(): Promise<AgencySettings | null> {
    const { data, error } = await supabase
      .from('agency_settings')
      .select('*')
      .order('updated_at', { ascending: false }) // Get latest if multiple rows exist
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return null;

    return {
      name: data.name || 'SocialFlow',
      logo: data.logo || '',
      contactEmail: data.contact_email || 'contato@agencia.com',
      primaryColor: data.primary_color || '#4f46e5',
      secondaryColor: data.secondary_color || '#818cf8',
      tertiaryColor: data.tertiary_color || '#c7d2fe',
      preferredClientId: data.preferred_client_id,
      preferredClientName: data.preferred_client_name
    };
  },

  async saveAgencySettings(settings: Partial<AgencySettings>): Promise<AgencySettings> {
    // 1. Discovery existing setting ID to ensure we update the latest one instead of inserting
    const { data: existing } = await supabase
      .from('agency_settings')
      .select('id')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const dbSettings: any = {
      name: settings.name,
      logo: settings.logo,
      contact_email: settings.contactEmail,
      primary_color: settings.primaryColor,
      secondary_color: settings.secondaryColor,
      tertiary_color: settings.tertiaryColor,
      preferred_client_id: settings.preferredClientId,
      preferred_client_name: settings.preferredClientName,
      updated_at: new Date().toISOString()
    };

    if (existing?.id) {
      console.log('Supabase: Updating agency settings in table "agency_settings" with ID:', existing.id);
      const { data, error } = await supabase
        .from('agency_settings')
        .update(dbSettings)
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error updating agency settings (table: agency_settings, id:', existing.id, '):', error);
        throw error;
      }
      
      return {
        name: data.name || 'SocialFlow',
        logo: data.logo || '',
        contactEmail: data.contact_email || 'contato@agencia.com',
        primaryColor: data.primary_color || '#4f46e5',
        secondaryColor: data.secondary_color || '#818cf8',
        tertiaryColor: data.tertiary_color || '#c7d2fe',
        preferredClientId: data.preferred_client_id,
        preferredClientName: data.preferred_client_name
      };
    } else {
      console.log('Supabase: Inserting agency settings into table "agency_settings"...');
      const { data, error } = await supabase
        .from('agency_settings')
        .insert(dbSettings)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase: Error inserting agency settings (table: agency_settings):', error);
        throw error;
      }
      
      return {
        name: data.name || 'SocialFlow',
        logo: data.logo || '',
        contactEmail: data.contact_email || 'contato@agencia.com',
        primaryColor: data.primary_color || '#4f46e5',
        secondaryColor: data.secondary_color || '#818cf8',
        tertiaryColor: data.tertiary_color || '#c7d2fe',
        preferredClientId: data.preferred_client_id,
        preferredClientName: data.preferred_client_name
      };
    }
  },

  // Auth check
  async isAuthorized(email: string): Promise<boolean> {
    if (!email) return false;
    
    // Explicitly allow the primary admin
    if (email === 'designcomd.contato@gmail.com') return true;

    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('email')
        .eq('email', email)
        .maybeSingle();
      
      if (error) {
        this.handleAuthError(error);
        console.error('Error checking authorization:', error);
        return false;
      }
      
      return !!data;
    } catch (err) {
      this.handleAuthError(err);
      return false;
    }
  },

  // Helper to handle standard auth errors
  handleAuthError(error: any) {
    if (!error) return;
    const msg = error.message || '';
    if (msg.includes('Refresh Token Not Found') || msg.includes('Refresh Token is invalid') || msg.includes('invalid_grant')) {
      console.error('Auth error detected, force logout:', msg);
      this.logout().catch(() => {});
    }
  },

  async login(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.warn('Supabase: Login falhou. Dica: Verifique se o usuário existe na aba Authentication > Users no seu painel do Supabase.');
        this.handleAuthError(error);
        throw error;
      }
      return data;
    } catch (err) {
      this.handleAuthError(err);
      throw err;
    }
  },

  async logout() {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Supabase: Error during signOut:', err);
    } finally {
      // Forcefully clear locastorage tokens related to supabase auth if needed
      try {
        localStorage.removeItem('supabase.auth.token');
        // Clear anything starting with sb- (Supabase default)
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes('supabase.auth.token') || key.startsWith('sb-'))) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {}
    }
  },

  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        if (error.message.includes('Refresh Token Not Found') || 
            error.message.includes('Refresh Token is invalid') ||
            error.message.includes('invalid_grant')) {
          console.warn('Supabase: Refresh token lost or invalid. Treating as signed out.');
          await this.logout();
          return { session: null };
        }
        throw error;
      }
      return data;
    } catch (err: any) {
      if (err.message?.includes('Refresh Token') || err.message?.includes('invalid_grant')) {
        await this.logout();
        return { session: null };
      }
      throw err;
    }
  },

  onAuthStateChange(callback: (event: any, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },

  async getAuthorizedUsers(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('email')
        .order('created_at');
      
      if (error) {
        this.handleAuthError(error);
        throw error;
      }
      return (data || []).map(u => u.email);
    } catch (err) {
      this.handleAuthError(err);
      throw err;
    }
  },

  async addAuthorizedUser(email: string) {
    const { error } = await supabase
      .from('authorized_users')
      .insert({ email });
    
    if (error) throw error;
  },

  async removeAuthorizedUser(email: string) {
    const { error } = await supabase
      .from('authorized_users')
      .delete()
      .eq('email', email);
    
    if (error) throw error;
  }
};
