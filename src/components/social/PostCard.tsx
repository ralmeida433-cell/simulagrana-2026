import React, { useState } from 'react';
import { Heart, Repeat, Share2, MessageCircle, MoreHorizontal, Flag, Trash2, Edit2, AlertCircle } from 'lucide-react';
import { socialService, Post } from '../../services/socialService';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
  onProfileClick?: (userId: string) => void;
}

export default function PostCard({ post, onDelete, onProfileClick }: PostCardProps) {
  const { user, profile } = useAuth();
  const [isLiking, setIsLiking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const isAuthor = user?.uid === post.userId;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      await socialService.likePost(post.id);
    } finally {
      setIsLiking(false);
    }
  };

  const handleRepost = async () => {
    try {
      await socialService.createPost(
        `RT: ${post.content}`, 
        profile ? { name: profile.name, avatar: profile.avatar, username: `@${user?.email?.split('@')[0] || 'investidor'}` } : undefined,
        true, 
        post.id
      );
      alert('Repostado com sucesso!');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleReport = async () => {
    if (!reportReason) return;
    try {
      await socialService.reportContent(post.id, 'post', reportReason);
      setIsReporting(false);
      setReportReason('');
      alert('Denúncia enviada. Nossa equipe analisará o conteúdo.');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Deseja excluir esta postagem?')) return;
    try {
      await socialService.deletePost(post.id);
      onDelete?.();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 transition-all hover:border-emerald-500/20 group relative overflow-hidden">
      {post.isRepost && (
        <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
          <Repeat className="w-3 h-3" /> Repostado
        </div>
      )}

      <div className="flex justify-between items-start">
        <div 
          className="flex gap-3 items-center cursor-pointer group"
          onClick={() => onProfileClick?.(post.userId)}
        >
          <Avatar 
            src={post.author?.avatar || undefined} 
            alt={post.author?.name || 'User'} 
            size="md" 
          />
          <div>
            <div className="font-bold text-sm flex items-center gap-2 group-hover:text-emerald-600 transition-colors">
              {post.author?.name || 'Investidor'}
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                {post.author?.username || '@investidor'}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ptBR })}
            </div>
          </div>
        </div>

        <div className="relative">
          <button 
            onClick={() => setShowOptions(!showOptions)}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-all"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {showOptions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowOptions(false)} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-xl shadow-xl z-20 py-1 overflow-hidden"
                >
                  {isAuthor ? (
                    <>
                      <button className="w-full px-4 py-2 text-left text-xs hover:bg-muted flex items-center gap-2 transition-all">
                        <Edit2 className="w-3.5 h-3.5" /> Editar Post (WIP)
                      </button>
                      <button 
                        onClick={handleDelete}
                        className="w-full px-4 py-2 text-left text-xs hover:bg-rose-500/10 text-rose-500 flex items-center gap-2 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir Post
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => { setIsReporting(true); setShowOptions(false); }}
                      className="w-full px-4 py-2 text-left text-xs hover:bg-muted flex items-center gap-2 transition-all"
                    >
                      <Flag className="w-3.5 h-3.5" /> Denunciar Conteúdo
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      <p className="text-sm text-foreground/90 leading-relaxed font-medium">
        {post.content}
      </p>

      <div className="flex items-center gap-6 pt-2 border-t border-border/50 text-muted-foreground">
        <button 
          onClick={handleLike}
          className={cn(
            "flex items-center gap-1.5 text-xs transition-all",
            isLiking ? "scale-110" : "hover:text-rose-500 active:scale-90"
          )}
        >
          <Heart className={cn("w-4 h-4", post.likesCount > 0 && "fill-rose-500 text-rose-500")} /> {post.likesCount}
        </button>
        <button 
          onClick={handleRepost}
          className="flex items-center gap-1.5 text-xs hover:text-emerald-500 transition-all active:scale-90"
        >
          <Repeat className="w-4 h-4" /> {post.repostsCount}
        </button>
        <button className="flex items-center gap-1.5 text-xs hover:text-indigo-500 transition-colors">
          <MessageCircle className="w-4 h-4" /> 0
        </button>
        <button className="flex items-center gap-1.5 text-xs hover:text-emerald-500 transition-colors ml-auto">
          <Share2 className="w-4 h-4" /> Compartilhar
        </button>
      </div>

      <AnimatePresence>
        {isReporting && (
          <div className="absolute inset-0 bg-background/95 backdrop-blur-sm z-30 p-6 flex flex-col justify-center animate-in fade-in">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-rose-500 font-bold mb-2">
                <AlertCircle className="w-5 h-5" /> Denunciar Publicação
              </div>
              <p className="text-xs text-muted-foreground">O conteúdo viola as diretrizes de discurso de ódio, ofensas ou atividade ilegal?</p>
              <textarea 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Descreva o motivo da denúncia..."
                className="w-full bg-muted border border-border rounded-xl p-3 text-xs h-24 focus:ring-1 focus:ring-rose-500 outline-none"
              />
              <div className="flex gap-2">
                <button 
                  onClick={handleReport}
                  className="flex-1 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-all"
                >
                  Enviar Denúncia
                </button>
                <button 
                  onClick={() => setIsReporting(false)}
                  className="flex-1 py-2 bg-muted text-foreground text-xs font-bold rounded-xl hover:bg-accent transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
