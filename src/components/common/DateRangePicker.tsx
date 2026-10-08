import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface DateRangePickerProps {
  startDate: string; // 'YYYY-MM-DD'
  endDate: string;   // 'YYYY-MM-DD'
  onChange: (start: string, end: string) => void;
  align?: 'left' | 'right';
  className?: string;
}

const formatDateToISO = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const formatDisplayDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts.map(Number);
  const date = new Date(year, month - 1, day);
  const monthName = date.toLocaleString('en-US', { month: 'short' });
  return `${monthName} ${day}, ${year}`;
};

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChange,
  align = 'right',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial view month from startDate or today
  const initialDate = useMemo(() => {
    if (startDate) {
      const [y, m] = startDate.split('-').map(Number);
      return { year: y, month: m - 1 };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  }, [startDate]);

  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Synchronize calendar view when startDate changes
  useEffect(() => {
    if (startDate) {
      const [y, m] = startDate.split('-').map(Number);
      if (!isNaN(y) && !isNaN(m)) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [startDate]);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  // Calendar calculations
  const daysInMonth = useMemo(() => {
    return new Date(viewYear, viewMonth + 1, 0).getDate();
  }, [viewYear, viewMonth]);

  const firstDayOfWeek = useMemo(() => {
    // 0 = Sunday, 1 = Monday, ...
    return new Date(viewYear, viewMonth, 1).getDay();
  }, [viewYear, viewMonth]);

  const handleDayClick = (day: number) => {
    const clickedISO = formatDateToISO(viewYear, viewMonth, day);

    // If no start date or both start and end dates are already set -> start fresh
    if (!startDate || (startDate && endDate)) {
      onChange(clickedISO, '');
    } else if (startDate && !endDate) {
      // If clicking before start date, swap or set
      if (clickedISO < startDate) {
        onChange(clickedISO, startDate);
        setIsOpen(false);
      } else {
        onChange(startDate, clickedISO);
        setIsOpen(false);
      }
    }
  };

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear - 6; y <= currentYear + 4; y++) {
      years.push(y);
    }
    return years;
  }, []);

  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const effectiveEnd = endDate || hoveredDate;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      {/* Trigger Button - Matches filter styling */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center justify-between gap-2 text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 font-medium hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-xs font-medium whitespace-nowrap text-slate-700">
            {startDate && endDate
              ? `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
              : startDate
              ? `${formatDisplayDate(startDate)} – End Date`
              : 'All Dates'}
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Calendar Dropdown Card */}
      {isOpen && (
        <div
          className={`absolute ${
            align === 'left' ? 'left-0' : 'right-0'
          } top-full mt-1.5 z-50 bg-white rounded-xl shadow-elevated border border-slate-200/90 p-3 w-[260px] max-w-[calc(100vw-1.5rem)] animate-fade-in select-none`}
        >
          {/* Header: Month Year Selectors & Navigation */}
          <div className="flex items-center justify-between pb-2 mb-0.5">
            <div className="flex items-center gap-1">
              <select
                value={viewMonth}
                onChange={e => setViewMonth(Number(e.target.value))}
                className="font-bold text-xs text-slate-900 bg-slate-50 hover:bg-slate-100 rounded px-1.5 py-0.5 cursor-pointer border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 tracking-wider"
                title="Select Month"
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={e => setViewYear(Number(e.target.value))}
                className="font-bold text-xs text-slate-900 bg-slate-50 hover:bg-slate-100 rounded px-1.5 py-0.5 cursor-pointer border border-slate-200 focus:outline-none focus:ring-1 focus:ring-brand-500 tracking-wider"
                title="Select Year"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                title="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 mb-1 text-center">
            {weekDays.map(day => (
              <div key={day} className="text-[10px] font-semibold text-slate-400 py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {/* Empty slots before first day of month */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7 w-full" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateISO = formatDateToISO(viewYear, viewMonth, day);

              const isStart = startDate === dateISO;
              const isEnd = endDate === dateISO;
              const hasFullRange = Boolean(startDate && effectiveEnd && startDate !== effectiveEnd);

              const isInRange =
                hasFullRange &&
                dateISO > (startDate < effectiveEnd! ? startDate : effectiveEnd!) &&
                dateISO < (startDate < effectiveEnd! ? effectiveEnd! : startDate);

              const isRangeBoundary = isStart || isEnd;

              return (
                <div
                  key={day}
                  className="relative h-7 flex items-center justify-center"
                  onMouseEnter={() => {
                    if (startDate && !endDate) {
                      setHoveredDate(dateISO);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredDate(null);
                  }}
                >
                  {/* Background highlight bands for range */}
                  {hasFullRange && (
                    <>
                      {/* If date is strictly inside range */}
                      {isInRange && (
                        <div className="absolute inset-y-0 inset-x-0 bg-[#dce4f7] z-0" />
                      )}

                      {/* If date is start date and range exists */}
                      {isStart && (
                        <div className="absolute inset-y-0 right-0 w-1/2 bg-[#dce4f7] z-0" />
                      )}

                      {/* If date is end date and range exists */}
                      {isEnd && (
                        <div className="absolute inset-y-0 left-0 w-1/2 bg-[#dce4f7] z-0" />
                      )}
                    </>
                  )}

                  {/* Date Button */}
                  <button
                    type="button"
                    onClick={() => handleDayClick(day)}
                    className={`relative z-10 h-6 w-6 text-[11px] flex items-center justify-center rounded-lg transition-all ${
                      isRangeBoundary
                        ? 'bg-[#1976d2] text-white font-bold shadow-sm shadow-blue-500/20'
                        : isInRange
                        ? 'text-slate-900 font-semibold hover:bg-blue-200/50'
                        : 'text-slate-700 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    {day}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
