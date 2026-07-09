import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function CustomSelect({ value, onChange, options, placeholder, className, icon }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={cn("relative w-full", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 outline-none",
          "bg-white dark:bg-[#15171C] border rounded-2xl shadow-sm",
          isOpen 
            ? "border-primary ring-2 ring-primary/20 dark:border-primary" 
            : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
        )}
      >
        <span className="flex items-center gap-2 truncate text-slate-800 dark:text-slate-200">
          {icon && <span className="text-slate-500">{icon}</span>}
          {selectedOption ? selectedOption.label : (placeholder || 'Selecione...')}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="text-slate-400 shrink-0"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute z-[100] w-full mt-2 outline-none origin-top"
          >
            {/* Glassmorphism background */}
            <div className="overflow-hidden rounded-2xl bg-white/90 dark:bg-[#1A1C23]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/10 dark:shadow-black/40 ring-1 ring-black/5 dark:ring-white/5">
              <div className="max-h-[320px] overflow-y-auto overscroll-contain py-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                {options.map((option) => {
                  const isSelected = option.value === String(value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-4 py-3 text-sm transition-colors relative group",
                        isSelected 
                          ? "text-primary bg-primary/5 font-semibold" 
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 font-medium"
                      )}
                    >
                      <span className="relative z-10">{option.label}</span>
                      
                      {isSelected && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          className="relative z-10"
                        >
                          <Check className="w-4 h-4 text-primary" />
                        </motion.div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
