import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, ExternalLink, UserPlus, Heart, Repeat, AlertTriangle, MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { socialService, Notification } from '../../services/socialService';
import { chatService } from '../../services/chatService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { Avatar } from '../ui/Avatar';

export default function NotificationCenter({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [clickedNotifId, setClickedNotifId] = useState<string | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    if (!user || loading) {
      if (!loading && !user) setNotifications([]);
      return;
    }

    const unsubscribe = socialService.subscribeToNotifications((notifs) => {
      setNotifications(notifs);
    });
    return () => unsubscribe();
  }, [user, loading]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'follow': 
      case 'follow_request': return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'like': return <Heart className="w-4 h-4 text-rose-500" />;
      case 'repost': return <Repeat className="w-4 h-4 text-emerald-500" />;
      case 'wallet_alert': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'message': 
      case 'chat_request': return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const [isBellAnimating, setIsBellAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleBellClick = () => {
    setIsBellAnimating(true);
    setIsOpen(!isOpen);
    setTimeout(() => setIsBellAnimating(false), 500);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button 
        onClick={handleBellClick}
        className={cn("relative p-2 rounded-full hover:bg-accent text-muted-foreground transition-all focus:outline-none", isBellAnimating && "animate-[notif-bell-shake_0.5s_ease-in-out]")}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="dropdown"
            initial={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, scale: 0.9, filter: "blur(4px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute right-0 mt-2 w-80 max-h-[480px] bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="font-bold text-sm">Notificações</h3>
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">WalletFollow</span>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-border/50 max-h-80 custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      className={cn(
                        "p-4 transition-colors hover:bg-muted/30 relative cursor-pointer",
                        !notif.read && "bg-emerald-500/5",
                        clickedNotifId === notif.id && "animate-[notif-item-click_0.4s_ease-out]"
                      )}
                      onClick={() => {
                        setClickedNotifId(notif.id);
                        setTimeout(() => {
                           socialService.markNotificationAsRead(notif.id);
                           setIsOpen(false);
                           setClickedNotifId(null);
                           if (onNavigate) {
                             if (notif.type === 'message' && notif.chatId) {
                               const url = new URL(window.location.href);
                               url.searchParams.set('tab', 'perfil');
                               url.searchParams.set('section', 'messages');
                               url.searchParams.set('chatId', notif.chatId);
                               window.history.pushState({}, '', url.toString());
                               window.dispatchEvent(new Event('popstate'));
                               onNavigate('perfil'); // Explicitly trigger tab change
                             } else if (notif.type === 'follow') {
                               const url = new URL(window.location.href);
                               url.searchParams.set('tab', 'walletfollow');
                               // we don't handle subtab specifically, walletfollow can default to requests or something
                               window.history.pushState({}, '', url.toString());
                               window.dispatchEvent(new Event('popstate'));
                             } else {
                               onNavigate('walletfollow');
                             }
                           }
                        }, 300);
                      }}
                    >
                      <div className="flex gap-3">
                        {['follow_request', 'chat_request'].includes(notif.type) ? (
                          <Avatar size="sm" src={notif.fromUser?.avatar} alt={notif.fromUser?.name || '?'} />
                        ) : (
                          <div className="mt-1">{getIcon(notif.type)}</div>
                        )}
                        <div className="flex-1 space-y-1">
                          <p className="text-xs leading-relaxed">
                            <span className="font-bold text-foreground">
                              {notif.fromUser?.name || 'Alguém'}
                            </span>{' '}
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(notif.createdAt, { addSuffix: true, locale: ptBR })}
                          </p>
                          {notif.type === 'follow_request' && (
                            <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                onClick={async () => {
                                  await socialService.acceptFollow(notif.fromUserId);
                                  await socialService.markNotificationAsRead(notif.id);
                                }}
                              >
                                <Check className="w-3 h-3" /> Aceitar
                              </button>
                              <button 
                                className="flex-1 bg-muted hover:bg-muted/80 text-foreground rounded-md py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                onClick={async () => {
                                  await socialService.rejectFollow(notif.fromUserId);
                                  await socialService.markNotificationAsRead(notif.id); // dismiss
                                }}
                              >
                                <X className="w-3 h-3" /> Recusar
                              </button>
                            </div>
                          )}
                          {notif.type === 'chat_request' && notif.chatId && (
                            <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                              <button 
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-md py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                onClick={async () => {
                                  await chatService.acceptChatRequest(notif.chatId!);
                                  await socialService.markNotificationAsRead(notif.id);
                                }}
                              >
                                <Check className="w-3 h-3" /> Aceitar
                              </button>
                              <button 
                                className="flex-1 bg-muted hover:bg-muted/80 text-foreground rounded-md py-1.5 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                onClick={async () => {
                                  await chatService.rejectChatRequest(notif.chatId!);
                                  await socialService.markNotificationAsRead(notif.id); // dismiss
                                }}
                              >
                                <X className="w-3 h-3" /> Recusar
                              </button>
                            </div>
                          )}
                        </div>
                        {!notif.read && (
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2" />
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-xs text-muted-foreground">Nenhuma notificação por aqui.</p>
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-border bg-muted/30">
                <button className="w-full py-2 text-[10px] font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-widest">
                  Ver todas as notificações
                </button>
              </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
