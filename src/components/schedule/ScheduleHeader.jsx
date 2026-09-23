import React from 'react';
import { format } from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  CalendarDays, 
  CalendarRange, 
  LayoutGrid 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const ScheduleHeader = ({
  view,
  setView,
  currentDate,
  setCurrentDate,
  navigateDate
}) => {
  return (
    <div className="sticky top-0 z-30 flex flex-col md:flex-row justify-between items-center gap-6 pb-4 mb-6 pt-2">
      <div className="flex items-center gap-4">
        <div className="flex bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-2xl p-1">
          <button 
            type="button"
            onClick={() => setView('day')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury transition-all flex items-center gap-2",
              view === 'day' ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <CalendarIcon size={14} /> Day
          </button>
          <button 
            type="button"
            onClick={() => setView('week')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury transition-all flex items-center gap-2",
              view === 'week' ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <CalendarRange size={14} /> Week
          </button>
          <button 
            type="button"
            onClick={() => setView('month')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury transition-all flex items-center gap-2",
              view === 'month' ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <CalendarDays size={14} /> Month
          </button>
          <button 
            type="button"
            onClick={() => setView('templates')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] uppercase tracking-luxury transition-all flex items-center gap-2",
              view === 'templates' ? "bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            <LayoutGrid size={14} /> Templates
          </button>
        </div>

        {view !== 'templates' && (
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => navigateDate('prev')}
              className="p-2 rounded-xl glass-card hover:bg-[var(--card-hover)] border-[var(--glass-border)]"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 rounded-xl glass-card text-[10px] uppercase tracking-luxury border-[var(--glass-border)] hover:bg-[var(--card-hover)] min-w-[80px]"
            >
              {view === 'week' ? 'This Week' : view === 'month' ? 'This Month' : 'Today'}
            </button>
            <button 
              type="button"
              onClick={() => navigateDate('next')}
              className="p-2 rounded-xl glass-card hover:bg-[var(--card-hover)] border-[var(--glass-border)]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <h2 className="text-2xl font-light tracking-luxury uppercase">
        {view === 'templates' ? 'Schedule Templates' : format(currentDate, view === 'month' ? 'MMMM yyyy' : 'MMMM d, yyyy')}
      </h2>
    </div>
  );
};

export default ScheduleHeader;
