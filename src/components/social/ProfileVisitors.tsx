import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { socialService } from '../../services/socialService';
import { Avatar } from '../ui/Avatar';
import { Eye, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileVisitors() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    socialService.getRecentVisitors(user.uid).then((data) => {
      setVisitors(data);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h3 className="text-xl font-bold flex items-center gap-3">
          <Eye className="w-5 h-5 text-emerald-500" />
          Visitantes Recentes
        </h3>
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
          Visível apenas para você
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        Estas são as últimas 7 pessoas que visitaram o seu perfil. As visitas são listadas da mais recente para a mais antiga.
      </p>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visitors.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-border rounded-2xl bg-muted/20">
          <Eye className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum visitante recente</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Seu perfil ainda não recebeu visitas logadas nos últimos dias.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visitors.map((visitor, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              key={visitor.visitorId + visitor.visitedAt}
              className="flex items-center justify-between p-4 bg-background border border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <Avatar src={visitor.avatar} alt={visitor.name || '?'} size="lg" />
                <div>
                  <h4 className="font-bold text-foreground text-sm sm:text-base">{visitor.name || 'Investidor Anônimo'}</h4>
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground font-medium">
                    <Clock className="w-3 h-3" />
                    {new Date(visitor.visitedAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
