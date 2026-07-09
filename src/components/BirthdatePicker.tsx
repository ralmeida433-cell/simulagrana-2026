import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { CustomSelect } from './ui/CustomSelect';

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
          <CustomSelect 
            value={day}
            onChange={(val) => setDay(val)}
            placeholder="Dia"
            options={days.map(d => ({ value: d, label: d.padStart(2, '0') }))}
          />
        </div>

        {/* Month */}
        <div className="flex-[1.5] relative">
          <CustomSelect 
            value={month}
            onChange={(val) => setMonth(val)}
            placeholder="Mês"
            options={months.map(m => ({ value: m.value, label: m.label }))}
          />
        </div>

        {/* Year */}
        <div className="flex-[1.5] relative">
          <CustomSelect 
            value={year}
            onChange={(val) => setYear(val)}
            placeholder="Ano"
            options={years.map(y => ({ value: y, label: y.toString() }))}
          />
        </div>
      </div>
      {error && (
        <p className="text-xs text-red-500 ml-1 font-medium">{error}</p>
      )}
    </div>
  );
}
