import React, { useState } from 'react';
import { Post, Client } from '../types';
import { cn, formatDate } from '../lib/utils';
import { Heart, MessageCircle, Share2, Bookmark, Play, Edit2, Check, X } from 'lucide-react';

interface FeedViewProps {
  client: Client;
  posts: Post[];
  onEditPost: (post: Post) => void;
  onUpdateClient: (client: Client) => void;
}

export function FeedView({ client, posts, onEditPost, onUpdateClient }: FeedViewProps) {
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [tempBio, setTempBio] = useState(client.bio || '');

  const clientPosts = posts
    .filter(p => p.clientId === client.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleSaveBio = () => {
    onUpdateClient({ ...client, bio: tempBio });
    setIsEditingBio(false);
  };

  const handleCancelBio = () => {
    setTempBio(client.bio || '');
    setIsEditingBio(false);
  };

  const totals = clientPosts.reduce((acc, p) => ({
    likes: acc.likes + (p.metrics?.likes || 0),
    comments: acc.comments + (p.metrics?.comments || 0),
    shares: acc.shares + (p.metrics?.shares || 0),
    saves: acc.saves + (p.metrics?.saves || 0),
  }), { likes: 0, comments: 0, shares: 0, saves: 0 });

  const latestFollowers = (client.followerHistory || [])[((client.followerHistory || []).length - 1)]?.count || 0;

  return (
    <div className="space-y-8">
      {/* Instagram Style Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 lg:p-10 shadow-sm">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Profile Picture */}
          <div className="relative group">
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
              <div className="w-full h-full rounded-full p-1 bg-white">
                <img 
                  src={client.logo} 
                  alt={client.name} 
                  className="w-full h-full rounded-full object-cover border border-slate-100" 
                />
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-4 w-full">
            <div className="flex flex-wrap items-center gap-4">
              <h2 className="text-xl font-semibold text-slate-900">{client.name}</h2>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span><strong className="text-slate-900">{totals.likes.toLocaleString()}</strong> likes</span>
              <span><strong className="text-slate-900">{totals.shares.toLocaleString()}</strong> compartilhamentos</span>
              <span><strong className="text-slate-900">{clientPosts.length.toLocaleString()}</strong> publicações</span>
              <span><strong className="text-slate-900">{totals.comments.toLocaleString()}</strong> comentários</span>
              <span><strong className="text-slate-900">{latestFollowers.toLocaleString()}</strong> seguidores</span>
            </div>

            <div className="space-y-1 group relative max-w-xl">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900">{client.name}</h3>
                {!isEditingBio && (
                  <button 
                    onClick={() => setIsEditingBio(true)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>

              {isEditingBio ? (
                <div className="space-y-2">
                  <textarea
                    value={tempBio}
                    onChange={(e) => setTempBio(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={handleCancelBio}
                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <button 
                      onClick={handleSaveBio}
                      className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors shadow-lg shadow-indigo-100"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {client.bio || 'Adicione uma bio para este cliente...'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Publicações</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clientPosts.map((post) => (
            <div 
              key={post.id} 
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group cursor-pointer hover:shadow-md transition-all"
              onClick={() => onEditPost(post)}
            >
              {/* Post Header */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={client.logo} alt="" className="w-8 h-8 rounded-full border border-slate-100" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 leading-none">{client.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{(post.channels || []).join(', ')}</p>
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider",
                  post.status === 'Postado' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                )}>
                  {post.status}
                </span>
              </div>

              {/* Post Image/Video Placeholder */}
              <div className="aspect-square bg-slate-100 relative overflow-hidden">
                {post.image ? (
                  <img src={post.image} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <Play size={48} />
                  </div>
                )}
                {post.format === 'Reels' && (
                  <div className="absolute top-2 right-2 p-1.5 bg-black/20 backdrop-blur-md rounded-lg text-white">
                    <Play size={14} fill="white" />
                  </div>
                )}
              </div>

              {/* Post Actions */}
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Heart size={20} />
                    <MessageCircle size={20} />
                    <Share2 size={20} />
                  </div>
                  <Bookmark size={20} className="text-slate-700" />
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-900">{(post.metrics?.likes || 0).toLocaleString()} curtidas</p>
                  <p className="text-xs text-slate-700 line-clamp-2">
                    <span className="font-bold mr-1">{client.name}</span>
                    {post.description}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-medium">
                    {formatDate(post.date, { day: 'numeric', month: 'long' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
