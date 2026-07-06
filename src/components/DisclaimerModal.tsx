import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Info, Cpu, Scale } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DisclaimerModalProps {
  onAccept?: () => void;
}

export default function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('simulagrana_terms_accepted');
    if (!hasAccepted) {
      setIsOpen(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('simulagrana_terms_accepted', 'true');
    setIsOpen(false);
    if (onAccept) onAccept();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-card rounded-3xl shadow-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="bg-emerald-600 p-6 text-white">
            <div className="flex items-center gap-3 mb-2">
              <ShieldAlert className="w-8 h-8" />
              <h2 className="text-2xl font-bold tracking-tight">Termos de Uso e Isenção de Responsabilidade</h2>
            </div>
            <p className="text-emerald-50 text-sm opacity-90">
              Por favor, leia atentamente antes de prosseguir para a plataforma.
            </p>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold">
                <Info className="w-5 h-5 text-emerald-600" />
                <h3>O que é o SimulaGrana?</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                O SimulaGrana é uma plataforma educacional de ferramentas e simuladores financeiros. Nosso objetivo é consolidar metodologias clássicas de análise (como Graham, Bazin e Lynch) em uma interface moderna para auxiliar no estudo do mercado de capitais.
              </p>
            </section>

            <section className="space-y-3 p-4 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                <AlertTriangle className="w-5 h-5" />
                <h3>Não é Recomendação de Investimento</h3>
              </div>
              <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                <span className="font-bold">Atenção:</span> Nenhuma informação, cálculo ou análise gerada por este programa constitui uma oferta, solicitação ou recomendação de compra ou venda de qualquer ativo financeiro. O SimulaGrana não é uma casa de análise e não possui certificação para recomendações de valores mobiliários.
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold">
                <Cpu className="w-5 h-5 text-blue-600" />
                <h3>Uso de Inteligência Artificial</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Algumas análises e resumos são gerados automaticamente por modelos de Inteligência Artificial. Embora busquemos a máxima precisão, a IA pode gerar informações imprecisas, desatualizadas ou alucinações. <span className="font-bold">Sempre verifique os dados em fontes oficiais.</span>
              </p>
            </section>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-foreground font-bold">
                < ShieldAlert className="w-5 h-5 text-red-600" />
                <h3>Limitação de Responsabilidade</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                O mercado financeiro envolve riscos. As análises podem conter falhas técnicas, distorções de dados de terceiros ou erros de interpretação. O usuário é o <span className="font-bold text-foreground uppercase">único e exclusivo responsável</span> por suas decisões de investimento e pelas consequências financeiras delas decorrentes.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-foreground font-bold">
                <Scale className="w-5 h-5 text-emerald-600" />
                <h3>Conformidade e Dados</h3>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                Ao utilizar esta plataforma, você declara estar ciente de que os dados são providos por APIs de terceiros e podem apresentar atrasos. Você também concorda com nossa Política de Privacidade e Termos de Uso.
              </p>
            </section>
          </div>

          {/* Footer */}
          <div className="p-6 bg-muted/50 border-t border-border flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-xs text-muted-foreground leading-tight">
                Ao clicar no botão abaixo, você confirma que leu, compreendeu e aceita todos os termos e isenções de responsabilidade listados acima.
              </p>
            </div>
            <button 
              onClick={handleAccept}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
            >
              Compreendo e Aceito os Termos
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
