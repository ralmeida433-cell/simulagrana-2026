import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { chatService, Chat, ChatMessage } from '../../services/chatService';
import { Avatar } from '../ui/Avatar';
import { 
  Send, ArrowLeft, Check, CheckCheck, Lock, MessageSquare, 
  Search, Paperclip, Smile, Mic, MoreVertical, Phone, Video, 
  Image as ImageIcon, FileText, X, Clock, Pin
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import EmojiPicker, { Theme } from 'emoji-picker-react';

export default function MessagesView() {
  const { user } = useAuth();
  const [chats, setChats] = useState<(Chat & { otherUserId: string, otherUser?: any })[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'favorites' | 'requests'>('all');

  const selectedChatData = chats.find(c => c.id === selectedChat);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const urlChatId = params.get('chatId');
      if (urlChatId && selectedChat !== urlChatId) {
        setSelectedChat(urlChatId);
      }
    };
    checkUrl();
    window.addEventListener('popstate', checkUrl);
    return () => window.removeEventListener('popstate', checkUrl);
  }, [selectedChat]);

  useEffect(() => {
    if (!user) return;
    const unsub = chatService.subscribeToUserChats(async (fetchedChats) => {
      const enriched = await Promise.all(fetchedChats.map(async (c) => {
        if (!c.otherUserId) return c as (Chat & { otherUserId: string, otherUser?: any });
        const otherUserDoc = await getDoc(doc(db, 'users', c.otherUserId));
        return {
          ...c,
          otherUserId: c.otherUserId, // explicitly pass otherUserId
          otherUser: otherUserDoc.exists() ? otherUserDoc.data() : { name: 'Usuário Desconhecido' }
        } as (Chat & { otherUserId: string, otherUser?: any });
      }));
      setChats(enriched);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!selectedChat || !selectedChatData?.otherUserId) return;
    
    const unsubscribe = chatService.subscribeToMessages(
      selectedChat,
      selectedChatData.otherUserId,
      (newMessages) => setMessages(newMessages)
    );
    
    // Simulate other user typing sometimes when we open chat
    setIsTyping(Math.random() > 0.5);
    const typingTimer = setTimeout(() => setIsTyping(false), 5000);
    
    return () => {
      unsubscribe();
      clearTimeout(typingTimer);
    };
  }, [selectedChat, selectedChatData?.otherUserId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !selectedChatData?.otherUserId) return;
    
    const text = newMessage.trim();
    setNewMessage('');
    setShowEmojiPicker(false);
    setShowAttachMenu(false);
    inputRef.current?.focus();
    
    try {
      await chatService.sendMessage(selectedChat, text, selectedChatData.otherUserId);
      setChats(prev => prev.map(c => 
        c.id === selectedChat 
          ? { ...c, lastMessage: text, lastMessageTime: Date.now() } 
          : c
      ));
    } catch (error: any) {
      alert("Erro ao enviar mensagem: " + error.message);
    }
  };

  const handleSendAttachment = async (type: 'image' | 'document') => {
    if (!selectedChat || !selectedChatData?.otherUserId) return;
    
    const simFilename = type === 'image' ? 'foto_imovel.jpg' : 'contrato.pdf';
    const text = `[ATTACHMENT:${type.toUpperCase()}] ${simFilename}`;
    
    setShowAttachMenu(false);
    
    try {
      await chatService.sendMessage(selectedChat, text, selectedChatData.otherUserId);
      setChats(prev => prev.map(c => 
        c.id === selectedChat 
          ? { ...c, lastMessage: text, lastMessageTime: Date.now() } 
          : c
      ));
    } catch (error: any) {
      alert("Erro ao enviar anexo: " + error.message);
    }
  };

  const formatMessageTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredChats = chats.filter(c => {
    const matchesSearch = c.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (activeTab === 'requests') {
      return c.status === 'requested';
    } else {
      // By default, don't show requests in the 'all' tab if they are requested by someone else AND not active
      if (c.status === 'requested' && c.requestedBy !== user?.uid) return false;
      return true;
    }
  });

  const hasRequests = chats.some(c => c.status === 'requested' && c.requestedBy !== user?.uid);

  const renderMessageContent = (content: string, isMine: boolean) => {
    if (content.startsWith('[ATTACHMENT:IMAGE]')) {
      const filename = content.replace('[ATTACHMENT:IMAGE]', '').trim();
      return (
        <div className="flex flex-col gap-1 -mx-2 -mt-1 mb-1">
          <div className="relative w-64 h-48 bg-black/5 dark:bg-white/5 rounded-xl overflow-hidden group">
             <img src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80" alt="attachment" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <ImageIcon className="text-white w-8 h-8 drop-shadow-md" />
             </div>
          </div>
          <span className={cn("text-[10px] truncate max-w-[240px] px-2", isMine ? "text-emerald-100" : "text-slate-400")}>{filename}</span>
        </div>
      );
    }
    if (content.startsWith('[ATTACHMENT:DOCUMENT]')) {
      const filename = content.replace('[ATTACHMENT:DOCUMENT]', '').trim();
      return (
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl border mb-1 -mx-1 mt-1",
          isMine 
            ? "bg-emerald-700/30 border-emerald-500/30" 
            : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
        )}>
          <div className={cn(
            "p-2 rounded-lg shrink-0",
            isMine ? "bg-emerald-500 text-white" : "bg-rose-500/20 text-rose-600 dark:text-rose-400"
          )}>
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex flex-col min-w-0 pr-4">
            <span className="text-sm font-semibold truncate leading-tight mb-0.5">{filename}</span>
            <span className={cn("text-xs", isMine ? "text-emerald-100" : "text-muted-foreground")}>2.4 MB • PDF</span>
          </div>
        </div>
      );
    }
    return <p className="break-words leading-relaxed">{content}</p>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 h-[80vh]">
        <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground animate-pulse">
          <MessageSquare className="w-10 h-10" />
          <p className="font-medium tracking-tight">Carregando mensagens criptografadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background w-full h-full sm:rounded-b-3xl flex overflow-hidden relative">
      
      {/* SIDEBAR: Chat List */}
      <div className={cn(
        "w-full md:w-[350px] border-r border-border flex flex-col bg-card/50 z-20 transition-transform duration-300",
        selectedChat ? "max-md:-translate-x-full absolute md:relative h-full" : "h-full"
      )}>
        {/* Sidebar Header */}
        <div className="px-5 py-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black tracking-tight">Chats</h2>
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full bg-accent text-muted-foreground flex items-center justify-center hover:bg-muted transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Buscar conversas..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-muted/50 border-none outline-none focus:ring-2 focus:ring-primary/50 text-sm py-2 pl-9 pr-4 rounded-xl transition-all"
            />
          </div>
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-hide">
             <button onClick={() => setActiveTab('all')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors", activeTab === 'all' ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80")}>Todos</button>
             <button onClick={() => setActiveTab('unread')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors", activeTab === 'unread' ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80")}>Não lidos</button>
             {hasRequests && (
               <button onClick={() => setActiveTab('requests')} className={cn("px-3 py-1.5 text-xs font-semibold rounded-lg shrink-0 transition-colors relative", activeTab === 'requests' ? "bg-primary text-primary-foreground" : "bg-muted text-foreground hover:bg-muted/80")}>
                 Solicitações
                 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background"></span>
               </button>
             )}
          </div>
        </div>
        
        {/* List of Chats */}
        <div className="flex-1 overflow-y-auto w-full">
          {filteredChats.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
              <MessageSquare className="w-8 h-8 opacity-20 mb-3" />
              <p>Nenhuma conversa encontrada.</p>
            </div>
          ) : (
             filteredChats.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0)).map((chat) => (
              <button
                key={chat.id}
                onClick={() => setSelectedChat(chat.id)}
                className={cn(
                  "w-full text-left p-4 border-b border-border hover:bg-muted/50 transition-colors flex items-center gap-3 relative group",
                  selectedChat === chat.id && "bg-muted/80"
                )}
              >
                <div className="relative">
                  <Avatar src={chat.otherUser?.avatar} alt={chat.otherUser?.name || '?'} size="md" />
                  {/* Simulate random online status */}
                  {(chat.lastMessageTime && chat.lastMessageTime % 3 !== 0) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-sm truncate text-foreground group-hover:text-primary transition-colors">{chat.otherUser?.name}</h3>
                    {chat.lastMessageTime && (
                      <span className={cn(
                        "text-[10px] shrink-0 font-medium",
                        selectedChat !== chat.id && Math.random() > 0.8 ? "text-primary" : "text-muted-foreground"
                      )}>
                        {formatMessageTime(chat.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground truncate leading-relaxed">
                      {chat.lastMessage || 'Nenhuma mensagem'}
                    </p>
                    {/* Fake unread badge for demo variation */}
                    {(selectedChat !== chat.id && Math.random() > 0.8) && (
                      <span className="w-4 h-4 bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center rounded-full shrink-0">
                        {Math.floor(Math.random() * 5) + 1}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* MAIN VIEW: Chat Room */}
      <div className={cn(
        "flex-1 flex flex-col bg-[#F5F6F8] dark:bg-[#0B1015] relative transition-transform duration-300 z-10",
        !selectedChat ? "max-md:translate-x-full absolute w-full md:relative md:translate-x-0 h-full" : "h-full w-full"
      )}>
        {selectedChat && selectedChatData ? (
          <>
            {/* Header */}
            <div className="h-16 px-4 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between sticky top-0 z-10 shrink-0">
              <div className="flex items-center gap-3 w-full max-w-[60%]">
                <button 
                  className="md:hidden p-2 -ml-2 text-muted-foreground hover:bg-muted rounded-full"
                  onClick={() => setSelectedChat(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar src={selectedChatData.otherUser?.avatar} alt={selectedChatData.otherUser?.name} size="sm" />
                <div className="flex flex-col min-w-0">
                  <h3 className="font-bold text-sm truncate">{selectedChatData.otherUser?.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs">
                    {isTyping ? (
                      <span className="text-primary font-medium animate-pulse">digitando...</span>
                    ) : (
                      <>
                         <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                         <span className="text-muted-foreground">Online agora</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button className="p-2 text-muted-foreground hover:bg-muted hover:text-primary rounded-full transition-colors hidden sm:flex">
                  <Search className="w-5 h-5" />
                </button>
                <button className="p-2 text-muted-foreground hover:bg-muted hover:text-primary rounded-full transition-colors">
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-muted-foreground hover:bg-muted hover:text-primary rounded-full transition-colors">
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div 
              className="flex-1 overflow-y-auto p-4 sm:p-6 pb-2 relative"
            >
              {/* Subtle Chat Background Pattern */}
              <div 
                className="absolute inset-0 z-0 opacity-[0.04] dark:opacity-[0.03] pointer-events-none" 
                style={{ 
                   backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM80 80c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM20 80c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM80 20c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM50 50c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z' fill='%23000000' fill-rule='evenodd'/%3E%3C/svg%3E")`, 
                   backgroundSize: '40px' 
                }} 
              />
              <div className="relative z-10">
               {/* Day Separator */}
               <div className="flex justify-center my-4">
                 <span className="px-3 py-1 bg-black/10 dark:bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur-sm">
                   Hoje
                 </span>
               </div>
               
               <div className="flex justify-center mb-6">
                 <div className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-4 py-2 rounded-xl text-xs flex flex-col items-center text-center gap-1 max-w-sm">
                   <Lock className="w-4 h-4 mb-1" />
                   <span className="font-bold">Criptografia de Ponta a Ponta</span>
                   <span className="opacity-80">Ninguém fora desta conversa pode ler ou ouvir estas mensagens.</span>
                 </div>
               </div>

              {messages.map((msg, index) => {
                const isMine = msg.senderId === user?.uid;
                const prevMsg = messages[index - 1];
                const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== msg.senderId);
                
                return (
                  <div key={msg.id} className={cn("flex w-full mb-3", isMine ? "justify-end" : "justify-start gap-2")}>
                    {!isMine && (
                      <div className="w-8 shrink-0 flex items-end">
                        {showAvatar && (
                          <Avatar src={selectedChatData.otherUser?.avatar} alt="" size="sm" className="w-7 h-7" />
                        )}
                      </div>
                    )}
                    
                    <div className={cn(
                      "max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 text-[15px] relative group shadow-sm",
                      isMine 
                        ? 'bg-emerald-600 text-white rounded-br-sm' 
                        : 'bg-card text-foreground rounded-bl-sm border border-border/50'
                    )}>
                      {renderMessageContent(msg.decryptedContent || '', isMine)}
                      
                      <div className={cn(
                        "flex items-center justify-end gap-1 mt-1 text-[10px]",
                        isMine ? "text-emerald-100/90" : "text-muted-foreground"
                      )}>
                        <span>{formatMessageTime(msg.createdAt)}</span>
                        {isMine && (
                          msg.status === 'read' ? <CheckCheck className="w-3.5 h-3.5" /> : 
                          msg.status === 'delivered' ? <CheckCheck className="w-3.5 h-3.5 opacity-70" /> : 
                          <Check className="w-3.5 h-3.5 opacity-70" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {isTyping && selectedChatData.status !== 'requested' && (
                <div className="flex w-full mb-4 justify-start gap-2">
                   <div className="w-8 shrink-0 flex items-end">
                      <Avatar src={selectedChatData.otherUser?.avatar} alt="" size="sm" className="w-7 h-7" />
                   </div>
                   <div className="bg-card text-foreground rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1 shadow-sm border border-border/50">
                     <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                     <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                     <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce"></span>
                   </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-2" />
              </div>
            </div>

            {/* Composer Box or Request Banner */}
            <div className="p-3 sm:p-4 bg-card border-t border-border mt-auto shrink-0 z-10 relative">
              {selectedChatData.status === 'requested' ? (
                <div className="flex flex-col items-center justify-center p-4">
                  {selectedChatData.requestedBy === user?.uid ? (
                    <div className="text-center text-muted-foreground text-sm">
                      <p>Aguardando {selectedChatData.otherUser?.name} aceitar sua solicitação de mensagem.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center gap-4 w-full">
                      <p className="text-sm font-medium">O usuário não está na sua rede. Aceita receber mensagens?</p>
                      <div className="flex gap-3 w-full justify-center">
                        <button 
                          className="px-6 py-2.5 rounded-xl border border-destructive/30 text-destructive hover:bg-destructive/10 font-bold transition-colors w-full sm:w-auto"
                          onClick={() => {
                             chatService.rejectChatRequest(selectedChatData.id).then(() => {
                               setChats(prev => prev.filter(c => c.id !== selectedChatData.id));
                               setSelectedChat(null);
                             });
                          }}
                        >
                          Recusar
                        </button>
                        <button 
                          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors shadow-sm w-full sm:w-auto"
                          onClick={() => {
                             chatService.acceptChatRequest(selectedChatData.id).then(() => {
                               setChats(prev => prev.map(c => c.id === selectedChatData.id ? { ...c, status: 'active' } : c));
                             });
                          }}
                        >
                          Aceitar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-full left-4 mb-2 z-50 shadow-2xl rounded-2xl overflow-hidden border border-border"
                      >
                        <EmojiPicker 
                          onEmojiClick={(emojiData) => setNewMessage(prev => prev + emojiData.emoji)}
                          theme={'auto' as Theme}
                          searchDisabled={false}
                          skinTonesDisabled
                          width={300}
                          height={400}
                        />
                      </motion.div>
                    )}

                    {showAttachMenu && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-full mb-4 z-50 bg-card border border-border shadow-2xl rounded-2xl p-4 flex gap-4 right-16 sm:left-16 sm:right-auto"
                      >
                        <button onClick={() => handleSendAttachment('image')} className="flex flex-col items-center gap-2 group">
                          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all flex items-center justify-center">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-medium">Foto</span>
                        </button>
                        <button onClick={() => handleSendAttachment('document')} className="flex flex-col items-center gap-2 group">
                          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 group-hover:bg-rose-500 group-hover:text-white transition-all flex items-center justify-center">
                            <FileText className="w-6 h-6" />
                          </div>
                          <span className="text-xs font-medium">Documento</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-muted/60 dark:bg-muted/20 border border-border/50 rounded-3xl p-1.5 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                    <button 
                      type="button"
                      onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAttachMenu(false); }}
                      className="p-2 sm:p-2.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      <Smile className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setShowAttachMenu(!showAttachMenu); setShowEmojiPicker(false); }}
                      className="p-2 sm:p-2.5 text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      <Paperclip className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                    
                    <input 
                      ref={inputRef}
                      type="text" 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onFocus={() => { setShowEmojiPicker(false); setShowAttachMenu(false); }}
                      placeholder="Mensagem" 
                      className="flex-1 bg-transparent border-none py-3 px-1 sm:px-2 text-sm sm:text-base outline-none min-w-0"
                      autoComplete="off"
                    />
                    
                    {newMessage.trim() ? (
                      <motion.button 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        type="submit"
                        className="p-2.5 sm:p-3 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-colors shadow-md shrink-0"
                      >
                        <Send className="w-4 h-4 sm:w-5 sm:h-5 -ml-0.5" />
                      </motion.button>
                    ) : (
                      <motion.button 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        type="button"
                        className="p-2.5 sm:p-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-md shrink-0"
                      >
                        <Mic className="w-4 h-4 sm:w-5 sm:h-5" />
                      </motion.button>
                    )}
                  </form>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center text-muted-foreground h-full relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
               <MessageSquare className="w-96 h-96" />
            </div>
            <div className="bg-card w-24 h-24 rounded-full flex items-center justify-center shadow-sm mb-6 border border-border/50 relative z-10">
              <MessageSquare className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2 relative z-10">Simula Grana Chat</h2>
            <p className="max-w-xs text-center text-sm mb-6 relative z-10">Selecione uma conversa ao lado ou inicie um novo chat com seus contatos.</p>
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 relative z-10">
              <Lock className="w-3 h-3" /> End-to-End Encrypted
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
