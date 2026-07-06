import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { socialService } from '../../services/socialService';
import { Avatar } from '../ui/Avatar';
import { Users, Check, X, ShieldAlert, UserMinus } from 'lucide-react';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function ProfileFollowers() {
  const { user } = useAuth();
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchFollowers = async () => {
      try {
        const q = query(
          collection(db, 'follows'),
          where('targetUserId', '==', user.uid)
        );
        const snapshot = await getDocs(q);
        
        const enrichList = await Promise.all(snapshot.docs.map(async (f) => {
          const data = f.data();
          const userDoc = await getDoc(doc(db, 'users', data.followerId));
          return {
            id: f.id,
            followerId: data.followerId,
            status: data.status,
            createdAt: data.createdAt,
            user: userDoc.exists() ? userDoc.data() : { name: 'Conta excluída' }
          };
        }));
        
        setFollowers(enrichList.sort((a, b) => b.createdAt - a.createdAt));
      } catch (e) {
        console.error("Falha ao carregar seguidores", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFollowers();
  }, [user]);

  const handleAccept = async (followerId: string) => {
    setUpdatingId(followerId);
    try {
      await socialService.acceptFollow(followerId);
      setFollowers(prev => prev.map(f => f.followerId === followerId ? { ...f, status: 'accepted' } : f));
    } catch (e: any) {
      alert(e.message);
    }
    setUpdatingId(null);
  };

  const handleReject = async (followerId: string) => {
    setUpdatingId(followerId);
    try {
      if (window.confirm("Deseja rejeitar esta solicitação?")) {
        await socialService.rejectFollow(followerId);
        setFollowers(prev => prev.filter(f => f.followerId !== followerId));
      }
    } catch (e: any) {
      alert(e.message);
    }
    setUpdatingId(null);
  };

  const handleRemove = async (followerId: string) => {
    setUpdatingId(followerId);
    try {
      if (window.confirm("Deseja excluir este seguidor da sua lista?")) {
        await socialService.removeFollower(followerId);
        setFollowers(prev => prev.filter(f => f.followerId !== followerId));
      }
    } catch (e: any) {
      alert(e.message);
    }
    setUpdatingId(null);
  };

  const pending = followers.filter(f => f.status === 'pending');
  const accepted = followers.filter(f => f.status === 'accepted');

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-8">
      <div className="border-b border-border pb-4">
        <h3 className="text-xl font-bold flex items-center gap-3">
          <Users className="w-5 h-5 text-emerald-500" />
          Seguidores e Solicitações
        </h3>
        <p className="text-sm text-muted-foreground mt-2">
          Gerencie quem pode visualizar sua carteira de investimentos baseada na sua configuração de privacidade.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Pending Requests */}
          {pending.length > 0 && (
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" /> 
                Solicitações Pendentes ({pending.length})
              </h4>
              <div className="space-y-3">
                {pending.map((req) => (
                  <div key={req.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                    <div className="flex items-center gap-4 cursor-pointer group" onClick={() => {
                      const url = new URL(window.location.href);
                      url.searchParams.set('tab', 'walletfollow');
                      url.searchParams.set('userId', req.followerId);
                      window.history.pushState({}, '', url.toString());
                      window.dispatchEvent(new Event('popstate'));
                    }}>
                      <Avatar src={req.user.avatar} alt={req.user.name} size="md" className="group-hover:ring-2 ring-emerald-500 transition-all" />
                      <div>
                        <h5 className="font-bold text-sm group-hover:text-emerald-500 transition-colors">{req.user.name}</h5>
                        <p className="text-xs text-muted-foreground">{req.user.username || 'Sem username'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleAccept(req.followerId)}
                        disabled={updatingId === req.followerId}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Aceitar
                      </button>
                      <button
                        onClick={() => handleReject(req.followerId)}
                        disabled={updatingId === req.followerId}
                        className="flex-1 sm:flex-none px-4 py-2 bg-muted hover:bg-rose-100 hover:text-rose-600 text-muted-foreground rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" /> Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Accepted Followers */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-foreground">
              Seus Seguidores ({accepted.length})
            </h4>
            
            {accepted.length === 0 ? (
              <div className="text-center p-8 bg-muted/20 border border-dashed border-border rounded-2xl">
                <p className="text-muted-foreground text-sm font-medium">Você ainda não possui seguidores.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accepted.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 sm:p-4 bg-card border border-border rounded-2xl hover:border-emerald-500/30 transition-colors">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => {
                        const url = new URL(window.location.href);
                        url.searchParams.set('tab', 'walletfollow');
                        url.searchParams.set('userId', f.followerId);
                        window.history.pushState({}, '', url.toString());
                        window.dispatchEvent(new Event('popstate'));
                      }}>
                        <Avatar src={f.user.avatar} alt={f.user.name} size="md" className="group-hover:ring-2 ring-emerald-500 transition-all" />
                        <div className="min-w-0">
                          <h5 className="font-bold text-sm truncate group-hover:text-emerald-500 transition-colors">{f.user.name}</h5>
                          <p className="text-[10px] text-muted-foreground">Seguindo desde {new Date(f.createdAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    <button
                      onClick={() => handleRemove(f.followerId)}
                      disabled={updatingId === f.followerId}
                      className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
                      title="Excluir seguidor"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
