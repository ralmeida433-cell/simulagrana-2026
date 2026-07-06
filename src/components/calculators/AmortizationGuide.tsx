import React from 'react';
import { Info, TrendingDown, Clock, CheckCircle2, AlertCircle, HelpCircle, Wand2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AmortizationGuide() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-8 h-8 text-indigo-200" />
            <h3 className="text-2xl font-bold">Prazo ou Prestação: Qual escolher?</h3>
          </div>
          <p className="text-indigo-100 text-lg leading-relaxed max-w-2xl">
            Essa é uma das decisões mais importantes dentro de um financiamento — e muita gente escolhe errado por não entender o impacto real.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-card p-6 rounded-3xl border border-border shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h4 className="font-bold text-lg text-foreground">Amortização por PRESTAÇÃO</h4>
          </div>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>Você mantém o prazo igual</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>A parcela diminui ao longo do tempo</span>
            </li>
            <li className="pt-2 font-semibold text-slate-900 dark:text-slate-200">👉 Efeito: Alívio no orçamento mensal e fluxo de caixa mais leve.</li>
          </ul>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-card p-6 rounded-3xl border border-border shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="font-bold text-lg text-foreground">Amortização por PRAZO</h4>
          </div>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>Você mantém o valor da parcela</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>O tempo do financiamento diminui</span>
            </li>
            <li className="pt-2 font-semibold text-slate-900 dark:text-slate-200">👉 Efeito: Quita muito mais rápido e reduz drasticamente os juros.</li>
          </ul>
        </motion.div>
      </div>

      <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white">
        <h4 className="text-lg sm:text-xl font-bold mb-6 flex items-center gap-2">
          <Info className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400 shrink-0" />
          📊 Diferença Real (O que muda no bolso)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div className="space-y-4">
            <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">🧠 Regra de Ouro</p>
            <p className="text-2xl font-light leading-tight">
              Juros dependem do <span className="text-indigo-400 font-bold italic underline decoration-indigo-400/30 underline-offset-4">tempo</span> — não do valor da parcela.
            </p>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="font-bold text-emerald-400 mb-1">✔ Amortizar no PRAZO:</p>
              <p className="text-sm text-slate-300">Menos meses pagando juros. Juros caem MUITO.</p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
              <p className="font-bold text-orange-400 mb-1">✔ Amortizar na PRESTAÇÃO:</p>
              <p className="text-sm text-slate-300">Continua pagando por muitos anos. Juros continuam acumulando.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-border shadow-sm">
          <h4 className="text-lg font-bold mb-6 text-foreground">💥 3. Qual é melhor?</h4>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-500/10 rounded-full flex items-center justify-center shrink-0">
                <span className="font-bold text-emerald-600">🥇</span>
              </div>
              <div>
                <p className="font-bold text-foreground">Melhor Financeiramente: PRAZO</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                  <li>Maior economia de juros</li>
                  <li>Quitação mais rápida</li>
                  <li>Menor custo total</li>
                </ul>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-500/10 rounded-full flex items-center justify-center shrink-0">
                <span className="font-bold text-indigo-600">🧘</span>
              </div>
              <div>
                <p className="font-bold text-foreground">Melhor Psicologicamente: PRESTAÇÃO</p>
                <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                  <li>Renda apertada</li>
                  <li>Quer reduzir risco mensal</li>
                  <li>Precisa de folga no orçamento</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-100 dark:border-slate-700/50">
          <h4 className="text-lg font-bold mb-6 text-foreground">📉 4. Exemplo Prático</h4>
          <div className="space-y-4">
            <div className="p-4 bg-card rounded-2xl border border-border">
              <p className="text-xs text-slate-500 uppercase font-bold mb-2">Seu Caso Hipotético</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">Parcela atual: <span className="font-bold text-foreground">R$ 1.092</span></p>
              <p className="text-sm text-slate-700 dark:text-slate-300">Amortização extra: <span className="font-bold text-indigo-600 dark:text-indigo-400">R$ 200/mês</span></p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-bold text-foreground">Reduzindo PRAZO:</span> Pode cortar anos e economizar dezenas de milhares em juros.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <p className="text-sm text-slate-600 dark:text-slate-400"><span className="font-bold text-foreground">Reduzindo PRESTAÇÃO:</span> Parcela cai gradualmente, mas economia de juros é bem menor.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-indigo-50 dark:bg-indigo-500/5 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-indigo-100 dark:border-indigo-500/10">
          <h4 className="text-lg font-bold mb-4 text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            🧠 6. Estratégia Inteligente (Nível Avançado)
          </h4>
          <p className="text-indigo-800 dark:text-indigo-200 font-medium mb-4">💡 Melhor abordagem real: <span className="font-bold">Estratégia Híbrida</span></p>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 p-4 bg-card rounded-2xl border border-indigo-100 dark:border-indigo-800">
              <p className="text-xs font-bold text-indigo-600 mb-1">PASSO 1</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Comece reduzindo <span className="font-bold text-foreground">PRESTAÇÃO</span> para ganhar fôlego.</p>
            </div>
            <div className="flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-indigo-300 rotate-90 md:rotate-0" />
            </div>
            <div className="flex-1 p-4 bg-card rounded-2xl border border-indigo-100 dark:border-indigo-800">
              <p className="text-xs font-bold text-indigo-600 mb-1">PASSO 2</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">Depois passe para <span className="font-bold text-foreground">PRAZO</span> para economizar forte.</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-500/5 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-amber-100 dark:border-amber-500/10 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-4 text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-bold uppercase text-xs tracking-widest">Resumo Final</span>
          </div>
          <p className="text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
            Se você aguenta pagar a mesma parcela: <span className="font-bold underline decoration-amber-500/30 underline-offset-4 italic">SEMPRE reduza o PRAZO.</span>
          </p>
          <div className="mt-6 flex gap-2">
            <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-bold uppercase">Economia = PRAZO</div>
            <div className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 rounded-full text-[10px] font-bold uppercase">Folga = PRESTAÇÃO</div>
          </div>
        </div>
      </div>
    </div>
  );
}
