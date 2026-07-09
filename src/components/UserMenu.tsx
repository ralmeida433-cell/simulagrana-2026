import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from './ui/Avatar';
import { LogIn, LogOut, User as UserIcon, ChevronDown, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function UserMenu() {
  const { user, profile, login, logout, loading, isAuthenticating } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />;
  }

  const handleToggle = () => setIsOpen(!isOpen);

  const handleAction = async (action: () => void) => {
    setIsOpen(false);
    await action();
  };

  return (
    <div className="relative flex items-center" ref={menuRef}>
      <button 
        onClick={handleToggle}
        className="flex items-center hover:opacity-80 transition-opacity focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar 
          src={profile?.avatar || user?.photoURL || undefined} 
          alt={profile?.name || user?.displayName || "User"} 
          className={cn("transition-transform duration-200", isOpen && "ring-2 ring-primary ring-offset-2 ring-offset-background")}
        />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-full mt-3 w-64 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {user ? (
              <>
                <div className="p-4 border-b border-border">
                  <p className="text-sm font-bold text-foreground truncate">{profile?.name || user?.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate mb-2">{user.email}</p>
                  
                  {/* AI Credits Badge/Indicator */}
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      <span>Análises de IA (24h)</span>
                      <span className={cn(
                        "font-mono text-xs font-bold",
                        (profile?.aiCreditsRemaining ?? 10) > 0 ? "text-primary" : "text-red-500"
                      )}>
                        {profile?.aiCreditsRemaining ?? 10}/10
                      </span>
                    </div>
                    <div className="w-full bg-border/40 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          (profile?.aiCreditsRemaining ?? 10) > 0 ? "bg-primary" : "bg-red-500"
                        )}
                        style={{ width: `${((profile?.aiCreditsRemaining ?? 10) / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => handleAction(logout)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-500/5 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sair da Conta
                  </button>
                </div>
              </>
            ) : (
              <div className="p-2">
                <div className="p-4 mb-2 text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <UserIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold">Acesse sua conta</h3>
                  <p className="text-xs text-muted-foreground mt-1">Entre para sincronizar sua carteira em todos os dispositivos.</p>
                </div>
                <button
                  onClick={() => handleAction(login)}
                  disabled={isAuthenticating}
                  className={cn(
                    "w-full flex items-center justify-center gap-3 px-4 py-3 text-sm font-bold bg-primary text-primary-foreground rounded-xl transition-all shadow-lg shadow-primary/20",
                    isAuthenticating ? "opacity-70 cursor-not-allowed" : "hover:bg-primary/90 active:scale-95"
                  )}
                >
                  {isAuthenticating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4" />
                  )}
                  {isAuthenticating ? 'Entrando...' : 'Entrar na Conta'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
