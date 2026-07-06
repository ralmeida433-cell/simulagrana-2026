const fs = require('fs');
let content = fs.readFileSync('src/components/social/PostCard.tsx', 'utf8');

const oldCard = `  return (
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
      </div>`;

const newCard = `  return (
    <div className="p-4 sm:p-5 group relative overflow-hidden hover:bg-muted/30 transition-colors cursor-pointer">
      <div className="flex gap-3 sm:gap-4">
        {/* Avatar Sidebar */}
        <div className="flex flex-col items-center">
           <Avatar 
              src={post.author?.avatar || undefined} 
              alt={post.author?.name || 'User'} 
              size="md" 
              className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 border border-border/50 cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onProfileClick?.(post.userId); }}
           />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {post.isRepost && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
              <Repeat className="w-3 h-3" /> Repostado
            </div>
          )}
          
          {/* Header Row */}
          <div className="flex justify-between items-start mb-1">
            <div 
              className="flex items-center gap-1.5 sm:gap-2 flex-wrap cursor-pointer"
              onClick={(e) => { e.stopPropagation(); onProfileClick?.(post.userId); }}
            >
              <span className="font-bold text-sm sm:text-base text-foreground hover:underline truncate max-w-[120px] sm:max-w-full">
                {post.author?.name || 'Investidor'}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground truncate">
                {post.author?.username || '@investidor'}
              </span>
              <span className="text-muted-foreground text-xs sm:text-sm">·</span>
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(post.createdAt, { addSuffix: true, locale: ptBR }).replace('aproximadamente', '').trim()}
              </span>
            </div>

            <div className="relative">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowOptions(!showOptions); }}
                className="p-1.5 sm:p-2 rounded-full hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-all opacity-0 group-hover:opacity-100"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              
              <AnimatePresence>
                {showOptions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setShowOptions(false); }} />
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 5 }}
                      className="absolute right-0 mt-1 w-48 bg-card border border-border/50 rounded-xl shadow-xl z-20 py-1 overflow-hidden"
                    >
                      {isAuthor ? (
                        <>
                          <button className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted flex items-center gap-2 transition-all">
                            <Edit2 className="w-4 h-4" /> Editar Post
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                            className="w-full px-4 py-2.5 text-left text-sm hover:bg-rose-500/10 text-rose-500 flex items-center gap-2 transition-all font-medium"
                          >
                            <Trash2 className="w-4 h-4" /> Excluir Post
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsReporting(true); setShowOptions(false); }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted flex items-center gap-2 transition-all"
                        >
                          <Flag className="w-4 h-4" /> Denunciar Conteúdo
                        </button>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Body */}
          <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap font-normal mb-3 pr-2">
            {post.content}
          </p>

          {/* Interaction Row */}
          <div className="flex items-center justify-between text-muted-foreground max-w-md pr-4 sm:pr-8">
            <button 
              onClick={(e) => { e.stopPropagation(); handleLike(); }}
              className="group/btn flex items-center gap-1.5 text-xs sm:text-sm transition-all"
            >
              <div className="p-1.5 sm:p-2 rounded-full group-hover/btn:bg-rose-500/10 group-hover/btn:text-rose-500 transition-colors">
                 <Heart className={cn("w-4 h-4 sm:w-5 sm:h-5", post.likesCount > 0 && "fill-rose-500 text-rose-500")} />
              </div>
              <span className={cn("group-hover/btn:text-rose-500 font-medium", post.likesCount > 0 && "text-rose-500")}>{post.likesCount || ''}</span>
            </button>

            <button className="group/btn flex items-center gap-1.5 text-xs sm:text-sm transition-all">
              <div className="p-1.5 sm:p-2 rounded-full group-hover/btn:bg-emerald-500/10 group-hover/btn:text-emerald-500 transition-colors">
                 <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="group-hover/btn:text-emerald-500 font-medium"></span>
            </button>

            <button 
              onClick={(e) => { e.stopPropagation(); handleRepost(); }}
              className="group/btn flex items-center gap-1.5 text-xs sm:text-sm transition-all"
            >
              <div className="p-1.5 sm:p-2 rounded-full group-hover/btn:bg-emerald-500/10 group-hover/btn:text-emerald-500 transition-colors">
                 <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="group-hover/btn:text-emerald-500 font-medium">{post.repostsCount || ''}</span>
            </button>

            <button className="group/btn flex items-center gap-1.5 text-xs sm:text-sm transition-all">
              <div className="p-1.5 sm:p-2 rounded-full group-hover/btn:bg-emerald-500/10 group-hover/btn:text-emerald-500 transition-colors">
                 <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </button>
          </div>
        </div>
      </div>`;

content = content.replace(oldCard, newCard);
fs.writeFileSync('src/components/social/PostCard.tsx', content);
