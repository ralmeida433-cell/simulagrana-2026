import React, { useState } from 'react';
import { ChevronRight, Cake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BirthdatePicker from './BirthdatePicker';

interface BirthdateModalProps {
  isOpen: boolean;
  onSave: (birthdate: string) => void;
}

export default function BirthdateModal({ isOpen, onSave }: BirthdateModalProps) {
  const [birthdate, setBirthdate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthdate) {
      setError('Por favor, informe sua data de nascimento.');
      return;
    }

    const selectedDate = new Date(birthdate);
    const today = new Date();
    
    if (selectedDate > today) {
      setError('A data de nascimento não pode ser no futuro.');
      return;
    }

    const age = today.getFullYear() - selectedDate.getFullYear();
    if (age < 0 || age > 120) {
      setError('Por favor, informe uma data de nascimento válida.');
      return;
    }

    onSave(birthdate);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-slate-950/80 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md bg-card rounded-3xl shadow-2xl border border-border overflow-hidden"
        >
          <div className="p-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 mx-auto">
              <Cake className="w-8 h-8" />
            </div>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Bem-vindo ao SimulaGrana!</h2>
              <p className="text-muted-foreground text-sm">
                Para personalizar suas simulações e mostrar sua idade projetada ao atingir seus objetivos, informe sua data de nascimento.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  Data de Nascimento
                </label>
                <BirthdatePicker
                  value={birthdate}
                  onChange={(val) => {
                    setBirthdate(val);
                    setError('');
                  }}
                  error={error}
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 group"
              >
                Começar a Simular
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>
          
          <div className="p-4 bg-muted/50 border-t border-border text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
              Seus dados são armazenados localmente e nunca saem do seu navegador.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
