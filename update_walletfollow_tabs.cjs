const fs = require('fs');
let content = fs.readFileSync('src/components/WalletFollow.tsx', 'utf8');

// Replace activeTab type
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'feed' | 'ranking' | 'my_profile'>('feed');",
  "const [activeTab, setActiveTab] = useState<'feed' | 'ranking' | 'my_profile' | 'messages'>('feed');"
);

// Import MessagesView
if (!content.includes('import MessagesView')) {
  content = content.replace(
    "import PostCard from './social/PostCard';",
    "import PostCard from './social/PostCard';\nimport MessagesView from './social/MessagesView';"
  );
}

// Modify layout and tabs
const oldTabsSection = `      <div className="flex flex-col gap-4">
        <div>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-4 text-center md:text-left">
            <AnimatedWalletLogo size="md" />
            <div className="flex-1 mt-2 md:mt-0">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                WalletFollow
              </h2>
              <p className="text-muted-foreground text-base md:text-lg font-medium tracking-tight mt-1">Acompanhe investidores de elite e compare sua performance.</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation and Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
          <div className="flex bg-muted/50 p-1 rounded-lg w-full sm:w-max overflow-x-auto scrollbar-none snap-x snap-mandatory">
            <button
              onClick={() => setActiveTab('feed')}
              className={cn(
                "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap snap-center shrink-0",
                activeTab === 'feed' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="w-3 h-3 sm:w-4 sm:h-4" />
              Feed de Atividades
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={cn(
                "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap snap-center shrink-0",
                activeTab === 'ranking' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />
              Top Performances
            </button>
            <button
              onClick={() => setActiveTab('my_profile')}
              className={cn(
                "px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap snap-center shrink-0",
                activeTab === 'my_profile' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Avatar src={profile?.avatar || user?.photoURL || undefined} size='sm' className='w-4 h-4 p-0 bg-transparent' />
              Meu Perfil
            </button>
          </div>
          
          <div className="relative w-full sm:w-64">
             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
             </div>
             <input
                type="text"
                placeholder="Pesquisar @usuario..."
                className="w-full pl-10 pr-4 py-2 bg-muted/50 border-none rounded-xl text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                value={communitySearchQuery}
                onChange={(e) => setCommunitySearchQuery(e.target.value)}
             />
          </div>
        </div>
      </div>`;

const newTabsSection = `      <div className="flex flex-col gap-0 border-b border-border/50 sticky top-0 bg-background/80 backdrop-blur-md z-30 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex flex-col md:flex-row items-center md:items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="hidden sm:block">
              <AnimatedWalletLogo size="md" />
            </div>
            <div className="flex-1 mt-0">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Comunidade
              </h2>
              <p className="text-muted-foreground text-xs md:text-sm font-medium tracking-tight mt-0.5">Explore ideias e invista melhor juntos</p>
            </div>
          </div>
          
          <div className="relative w-full sm:w-64 shrink-0">
             <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
             </div>
             <input
                type="text"
                placeholder="Pesquisar @usuario..."
                className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border/50 rounded-full text-sm focus:ring-1 focus:ring-emerald-500 outline-none transition-all focus:bg-background"
                value={communitySearchQuery}
                onChange={(e) => setCommunitySearchQuery(e.target.value)}
             />
          </div>
        </div>

        {/* Tab Navigation X-Style */}
        <div className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory">
            <button
              onClick={() => setActiveTab('feed')}
              className={cn(
                "px-4 py-4 text-sm font-bold transition-all flex items-center justify-center whitespace-nowrap snap-center shrink-0 relative flex-1 sm:flex-none",
                activeTab === 'feed' ? "text-foreground" : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/20"
              )}
            >
              Feed
              {activeTab === 'feed' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('ranking')}
              className={cn(
                "px-4 py-4 text-sm font-bold transition-all flex items-center justify-center whitespace-nowrap snap-center shrink-0 relative flex-1 sm:flex-none",
                activeTab === 'ranking' ? "text-foreground" : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/20"
              )}
            >
              Rankings
              {activeTab === 'ranking' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={cn(
                "px-4 py-4 text-sm font-bold transition-all flex items-center justify-center whitespace-nowrap snap-center shrink-0 relative flex-1 sm:flex-none",
                activeTab === 'messages' ? "text-foreground" : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/20"
              )}
            >
              Mensagens
              {activeTab === 'messages' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full" />}
            </button>
            <button
              onClick={() => setActiveTab('my_profile')}
              className={cn(
                "px-4 py-4 text-sm font-bold transition-all flex items-center justify-center whitespace-nowrap snap-center shrink-0 relative flex-1 sm:flex-none",
                activeTab === 'my_profile' ? "text-foreground" : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/20"
              )}
            >
              Meu Perfil
              {activeTab === 'my_profile' && <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-t-full" />}
            </button>
          </div>
      </div>`;

content = content.replace(oldTabsSection, newTabsSection);

// Add the messages render block at the bottom
const oldEnding = `          <div className="border-t border-border pt-6">
            <h4 className="font-bold mb-4">Minhas Atividades</h4>
            <div className="space-y-4">
                {posts.filter(p => p.userId === user?.uid).map(post => (
                  <PostCard key={post.id} post={post} onProfileClick={handleProfileClick} />
                ))}
                {posts.filter(p => p.userId === user?.uid).length === 0 && (
                  <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center">
                      <p className="text-sm text-muted-foreground">Você ainda não fez nenhuma publicação.</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

const newEnding = `          <div className="border-t border-border pt-6">
            <h4 className="font-bold mb-4">Minhas Atividades</h4>
            <div className="space-y-4">
                {posts.filter(p => p.userId === user?.uid).map(post => (
                  <PostCard key={post.id} post={post} onProfileClick={handleProfileClick} />
                ))}
                {posts.filter(p => p.userId === user?.uid).length === 0 && (
                  <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center">
                      <p className="text-sm text-muted-foreground">Você ainda não fez nenhuma publicação.</p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="w-full h-[70vh] min-h-[600px] bg-card rounded-2xl border border-border overflow-hidden">
          <MessagesView />
        </div>
      )}
    </div>
  );
}`;

content = content.replace(oldEnding, newEnding);

// Transform the new post creator box to look like X's compose box.
const oldPostBox = `        <div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-6">
          <div className="flex gap-4">
            <Avatar src={profile?.avatar || user?.photoURL || undefined} alt={user?.displayName || 'User'} className="w-10 h-10 shrink-0" />
            <div className="flex-1 space-y-3">
              <textarea
                placeholder="Compartilhe suas ideias sobre investimentos..."
                className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 min-h-[80px] text-foreground text-sm"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-2">
                   {/* Add media buttons later if needed */}
                </div>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || isSubmitting}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Publicar
                </button>
              </div>
            </div>
          </div>
        </div>`;

const newPostBox = `        <div className="bg-card border-b border-border p-4 mb-2 shadow-sm rounded-t-xl sm:rounded-xl sm:border">
          <div className="flex gap-4">
            <Avatar src={profile?.avatar || user?.photoURL || undefined} alt={user?.displayName || 'User'} className="w-12 h-12 shrink-0" />
            <div className="flex-1 space-y-2">
              <textarea
                placeholder="O que está acontecendo no mercado?"
                className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 pt-2 min-h-[60px] text-foreground text-lg placeholder:text-muted-foreground outline-none"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div className="flex items-center justify-between border-t border-border/50 pt-2 mt-2">
                <div className="flex items-center gap-1 text-emerald-500">
                   {/* Visual placeholders for future media/action buttons */}
                   <button className="w-8 h-8 rounded-full hover:bg-emerald-500/10 flex items-center justify-center transition-colors"><Globe className="w-4 h-4" /></button>
                </div>
                <button
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() || isSubmitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:bg-emerald-500/50 text-white text-sm font-bold rounded-full transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Postar
                </button>
              </div>
            </div>
          </div>
        </div>`;

content = content.replace(oldPostBox, newPostBox);

// Simplify and modernize the Ranking list layout
const oldRankingTab = `      {activeTab === 'ranking' && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b border-border bg-muted/30 text-xs font-bold text-muted-foreground uppercase">
               <div className="col-span-1 text-center">Posição</div>
               <div className="col-span-6">Investidor</div>
               <div className="col-span-3 text-right hidden md:block">Rentabilidade (12m)</div>
               <div className="col-span-2 text-right hidden md:block">Seguidores</div>
            </div>
            <div className="divide-y divide-border">
              {formattedPublicUsers.map((wallet, index) => (
                <div 
                  key={wallet.id}
                  onClick={() => handleProfileClick(wallet.id)}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center hover:bg-muted/20 transition-colors cursor-pointer group"
                >
                  <div className="hidden md:flex col-span-1 justify-center">
                    {index === 0 ? <Trophy className="w-6 h-6 text-yellow-500" /> : 
                     index === 1 ? <Trophy className="w-6 h-6 text-slate-400" /> : 
                     index === 2 ? <Trophy className="w-6 h-6 text-amber-700" /> : 
                     <span className="text-muted-foreground font-bold">{index + 1}º</span>}
                  </div>
                  
                  <div className="md:col-span-6 flex items-center gap-3">
                    <Avatar src={wallet.avatar || undefined} alt={wallet.name} size="sm" className="w-10 h-10 sm:w-12 sm:h-12 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm group-hover:text-primary transition-colors truncate">{wallet.name}</div>
                      <div className="text-[10px] px-2 py-0.5 bg-muted rounded-full w-fit mt-1 font-bold text-muted-foreground uppercase">Risco {wallet.risk}</div>
                    </div>
                  </div>

                  <div className="col-span-full md:col-span-3 flex justify-between md:block text-right border-t border-border/50 md:border-0 pt-2 md:pt-0 mt-2 md:mt-0">
                    <div className="text-left md:text-right">
                       <div className="text-[10px] md:hidden text-muted-foreground uppercase font-bold">Rentabilidade</div>
                       <div className="text-sm font-black text-emerald-500">+{wallet.performance}%</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] md:hidden text-muted-foreground uppercase font-bold">Seguidores</div>
                      <div className="text-sm font-bold md:hidden">{wallet.followers}</div>
                      <div className="text-[10px] text-muted-foreground hidden md:block">vs IBOV +5.2%</div>
                    </div>
                  </div>

                  <div className="hidden md:block col-span-2 text-right">
                    <div className="text-sm font-bold">{wallet.followers}</div>
                    <div className="text-[10px] text-muted-foreground">seguidores</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 bg-muted/50 rounded-xl border border-dashed border-border text-center">
            <p className="text-xs text-muted-foreground">
              Quer aparecer no ranking? Ative a <b>Visibilidade da Carteira</b> nas configurações do seu perfil.
            </p>
          </div>
        </div>
      )}`;

const newRankingTab = `      {activeTab === 'ranking' && (
        <div className="space-y-4 max-w-3xl mx-auto w-full pt-2">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-border bg-card">
               <h3 className="text-xl font-bold tracking-tight flex items-center gap-2"><Trophy className="w-5 h-5 text-emerald-500"/> Top Performances (12m)</h3>
               <p className="text-sm text-muted-foreground">Descubra e siga as carteiras mais rentáveis da comunidade.</p>
            </div>
            <div className="divide-y divide-border">
              {formattedPublicUsers.map((wallet, index) => (
                <div 
                  key={wallet.id}
                  onClick={() => handleProfileClick(wallet.id)}
                  className="flex flex-col sm:flex-row gap-4 p-5 sm:items-center hover:bg-muted/30 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-8 font-bold text-center text-muted-foreground flex justify-center">
                      {index === 0 ? <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-sm" /> : 
                       index === 1 ? <Trophy className="w-6 h-6 text-slate-400 drop-shadow-sm" /> : 
                       index === 2 ? <Trophy className="w-6 h-6 text-amber-600 drop-shadow-sm" /> : 
                       <span>{index + 1}</span>}
                    </div>
                    
                    <Avatar src={wallet.avatar || undefined} alt={wallet.name} size="md" className="w-12 h-12 shrink-0 border border-border/50" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base group-hover:text-emerald-500 transition-colors truncate">{wallet.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                         <span className="text-xs text-muted-foreground">@{wallet.username || \`user\${wallet.id.slice(0,4)}\`}</span>
                         <span className="text-[10px] px-2 py-0.5 bg-muted rounded-md font-bold text-muted-foreground uppercase tracking-wider">Risco {wallet.risk}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 ml-12 sm:ml-0 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-border/50 sm:border-0">
                    <div className="text-left sm:text-right">
                       <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Rentabilidade</div>
                       <div className="text-lg font-black text-emerald-500">+{wallet.performance}%</div>
                    </div>
                    <div className="text-right hidden sm:block">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Seguidores</div>
                      <div className="text-sm font-bold text-foreground">{wallet.followers}</div>
                    </div>
                    
                    <button className="sm:hidden px-4 py-1.5 bg-foreground text-background text-xs font-bold rounded-full">
                       Ver Perfil
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-5 bg-muted/30 rounded-2xl border border-dashed border-border/60 text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Quer competir no ranking? Ative a <b>Visibilidade da Carteira</b> no seu perfil.
            </p>
          </div>
        </div>
      )}`;

content = content.replace(oldRankingTab, newRankingTab);

// Re-adjust Feed rendering layout (remove the title and just show posts)
const oldFeedRendering = `      {activeTab === 'feed' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Feed de Atividades</h3>
          {posts.map(post => (
            <PostCard key={post.id} post={post} onProfileClick={handleProfileClick} />
          ))}
          {posts.length === 0 && !loading && (
            <div className="bg-muted/30 border border-dashed border-border rounded-xl p-8 text-center">
                <p className="text-sm text-muted-foreground">O feed está vazio. Seja o primeiro a publicar!</p>
            </div>
          )}
        </div>
      )}`;

const newFeedRendering = `      {activeTab === 'feed' && (
        <div className="w-full max-w-2xl mx-auto space-y-0 sm:border sm:border-border sm:rounded-xl overflow-hidden sm:bg-card">
          <div className="hidden sm:block border-b border-border bg-card p-4">
             <h3 className="font-bold text-lg tracking-tight">O que está acontecendo</h3>
          </div>
          {posts.map(post => (
            <div key={post.id} className="border-b border-border/50 last:border-0">
               <PostCard post={post} onProfileClick={handleProfileClick} />
            </div>
          ))}
          {posts.length === 0 && !loading && (
            <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">O feed está vazio. Seja o primeiro a postar!</p>
            </div>
          )}
        </div>
      )}`;

content = content.replace(oldFeedRendering, newFeedRendering);

fs.writeFileSync('src/components/WalletFollow.tsx', content);
