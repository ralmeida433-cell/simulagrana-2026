import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface BirthdatePickerProps {
  value: string; // ISO format YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
}

export default function BirthdatePicker({ value, onChange, error }: BirthdatePickerProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  // Initialize from value
  useEffect(() => {
    if (value) {
      const [vYear, vMonth, vDay] = value.split('-');
      setYear(vYear || '');
      setMonth(vMonth || '');
      setDay(vDay || '');
    }
  }, [value]);

  // Update parent when any part changes
  useEffect(() => {
    if (day && month && year) {
      const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      if (isoDate !== value) {
        onChange(isoDate);
      }
    } else if (!day && !month && !year) {
      if (value !== '') onChange('');
    }
  }, [day, month, year, onChange, value]);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 121 }, (_, i) => (currentYear - i).toString());
  const months = [
    { value: '1', label: 'Jan' },
    { value: '2', label: 'Fev' },
    { value: '3', label: 'Mar' },
    { value: '4', label: 'Abr' },
    { value: '5', label: 'Mai' },
    { value: '6', label: 'Jun' },
    { value: '7', label: 'Jul' },
    { value: '8', label: 'Ago' },
    { value: '9', label: 'Set' },
    { value: '10', label: 'Out' },
    { value: '11', label: 'Nov' },
    { value: '12', label: 'Dez' },
  ];

  const getDaysInMonth = (m: string, y: string) => {
    if (!m) return 31;
    const monthInt = parseInt(m, 10);
    const yearInt = y ? parseInt(y, 10) : 2000; // Default to leap year if no year
    return new Date(yearInt, monthInt, 0).getDate();
  };

  const daysCount = getDaysInMonth(month, year);
  const days = Array.from({ length: daysCount }, (_, i) => (i + 1).toString());

  // Ensure day is valid when month/year changes
  useEffect(() => {
    if (day && parseInt(day, 10) > daysCount) {
      setDay(daysCount.toString());
    }
  }, [month, year, day, daysCount]);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {/* Day */}
        <div className="flex-1 relative">
          <select
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="w-full pl-3 pr-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white appearance-none text-sm"
          >
            <option value="">Dia</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d.padStart(2, '0')}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Month */}
        <div className="flex-[1.5] relative">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-full pl-3 pr-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white appearance-none text-sm"
          >
            <option value="">Mês</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Year */}
        <div className="flex-[1.5] relative">
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full pl-3 pr-8 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white appearance-none text-sm"
          >
            <option value="">Ano</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 ml-1 font-medium">{error}</p>
      )}
    </div>
  );
}
