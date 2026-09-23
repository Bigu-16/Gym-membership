import React from 'react';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const TemplateModal = ({
  isOpen,
  handleCloseModal,
  editingTemplate,
  selectedClassOption,
  setSelectedClassOption,
  uniqueClassNames = [],
  selectedDays = [],
  setSelectedDays,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  capacity,
  setCapacity,
  onAddTemplate,
  onUpdateTemplate
}) => {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      alert('Please select at least one training day.');
      return;
    }
    
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const shortDays = {
      'Monday': 'Mon',
      'Tuesday': 'Tue',
      'Wednesday': 'Wed',
      'Thursday': 'Thu',
      'Friday': 'Fri',
      'Saturday': 'Sat',
      'Sunday': 'Sun'
    };
    
    const formattedDaysStr = selectedDays
      .sort((a, b) => daysOrder.indexOf(a) - daysOrder.indexOf(b))
      .map(d => shortDays[d])
      .join(', ');

    const formatTime12h = (t24) => {
      const [hStr, mStr] = t24.split(':');
      const h = parseInt(hStr, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${mStr} ${ampm}`;
    };

    const templateData = {
      className: selectedClassOption.trim() || 'General Class',
      days: formattedDaysStr,
      time: `${formatTime12h(startTime)} - ${formatTime12h(endTime)}`,
      capacity: parseInt(capacity, 10)
    };

    if (editingTemplate) {
      onUpdateTemplate({
        ...editingTemplate,
        ...templateData
      });
    } else {
      onAddTemplate(templateData);
    }

    handleCloseModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md h-full glass-card p-8 shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-500 border-[var(--glass-border)] bg-[var(--bg-secondary)]">
        <button 
          type="button"
          onClick={handleCloseModal}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--glass-border)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <X size={18} />
        </button>
        
        <div className="mb-8">
          <span className="px-4 py-1.5 rounded-full text-[10px] uppercase tracking-luxury font-bold mb-4 inline-block bg-[var(--text-primary)]/10 text-[var(--text-primary)]">
            Configuration Panel
          </span>
          <h2 className="text-3xl font-light tracking-luxury uppercase mb-2">
            {editingTemplate ? 'Edit Template' : 'New Template'}
          </h2>
          <p className="text-[var(--text-secondary)] text-xs">
            {editingTemplate ? 'Modify this recurring training session template.' : 'Define a recurring training session for group classes.'}
          </p>
        </div>

        <form 
          onSubmit={handleSubmit}
          className="space-y-6 flex-grow flex flex-col justify-between"
        >
          <div className="space-y-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
            {/* Session Name Combo Selector */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Class / Session Name</label>
              <input
                required
                type="text"
                list="class-names-list"
                value={selectedClassOption}
                onChange={(e) => setSelectedClassOption(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all"
                placeholder="Type to search or add custom class..."
              />
              <datalist id="class-names-list">
                {uniqueClassNames.map(name => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>

            {/* Select Days */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Days of the Week</label>
              <div className="flex flex-wrap gap-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setSelectedDays(prev => 
                          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                        );
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all border",
                        isSelected 
                          ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent" 
                          : "bg-[var(--bg-primary)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]/40"
                      )}
                    >
                      {day.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Time & End Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">Start Time</label>
                <input
                  required
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] ml-1">End Time</label>
                <input
                  required
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all cursor-pointer"
                />
              </div>
            </div>

            {/* Capacity Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)]">Max Capacity</label>
                <span className="text-xs font-bold text-[var(--text-primary)]">{capacity} Members</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="30"
                  step="1"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                  className="flex-grow accent-[var(--text-primary)] cursor-pointer"
                />
                <input
                  type="number"
                  min="5"
                  max="30"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value, 10))}
                  className="w-16 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-lg px-2 py-2 text-center text-xs focus:outline-none focus:ring-1 focus:ring-[var(--text-primary)]/20"
                />
              </div>
            </div>
          </div>

          <div className="pt-8 flex gap-4">
            <button 
              type="submit"
              className="flex-grow py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold hover:opacity-90 transition-all"
            >
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </button>
            <button 
              type="button"
              onClick={handleCloseModal}
              className="px-8 py-4 rounded-2xl glass-card text-[10px] uppercase tracking-luxury font-bold border-[var(--glass-border)] hover:bg-[var(--card-hover)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateModal;
