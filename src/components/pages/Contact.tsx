import React from 'react';
import { Mail, MessageSquare, Send, MapPin, Phone } from 'lucide-react';

export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-20">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
          <Mail className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Fale Conosco</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Tem alguma dúvida, sugestão ou feedback? Adoraríamos ouvir você.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
            <Mail className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">E-mail</h2>
          <p className="text-muted-foreground text-sm">contato@simulagrana.com.br</p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto text-blue-600 dark:text-blue-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Suporte</h2>
          <p className="text-muted-foreground text-sm">suporte@simulagrana.com.br</p>
        </div>

        <div className="bg-card border border-border rounded-3xl p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto text-purple-600 dark:text-purple-400">
            <Send className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold">Feedback</h2>
          <p className="text-muted-foreground text-sm">feedback@simulagrana.com.br</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 dark:bg-slate-950  focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Seu nome..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">E-mail</label>
              <input 
                type="email" 
                className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 dark:bg-slate-950  focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Mensagem</label>
            <textarea 
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-border bg-slate-50 dark:bg-slate-950  focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
              placeholder="Como podemos ajudar?"
            />
          </div>
          <button className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20">
            Enviar Mensagem
          </button>
        </form>
      </div>
    </div>
  );
}
