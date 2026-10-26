import { useState } from 'react';
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
  trainer = '',
  setTrainer,
  onAddTemplate,
  onUpdateTemplate
}) => {
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      setError('Select at least one training day.');
      return;
    }
    if (endTime <= startTime) {
      setError('End time must be after the start time.');
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

    const templateData = {
      className: selectedClassOption.trim() || 'General Class',
      type: editingTemplate?.type || 'group',
      days: formattedDaysStr,
      // Same 24h "HH:MM - HH:MM" form as the official timetable.
      time: `${startTime} - ${endTime}`,
      capacity: capacity === '' || capacity === null ? null : parseInt(capacity, 10),
      trainer: trainer.trim() || null
    };

    setSaving(true);
    setError('');
    try {
      if (editingTemplate) {
        await onUpdateTemplate({
          ...editingTemplate,
          ...templateData
        });
      } else {
        await onAddTemplate(templateData);
      }
      handleCloseModal();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save schedule template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black bg-opacity-40">
      <div className="w-full max-w-md h-full glass-card p-8 relative flex flex-col border-[var(--glass-border)] bg-[var(--bg-secondary)]">
        <button 
          type="button"
          onClick={handleCloseModal}
          aria-label="Close"
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--glass-border)] transition-all text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <X size={18} />
        </button>
        
        <div className="mb-8">
          <span className="px-4 py-1.5 rounded-full text-xs font-bold mb-4 inline-block bg-[var(--text-primary)]/10 text-[var(--text-primary)]">
            Configuration Panel
          </span>
          <h2 className="text-3xl font-semibold mb-2">
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
              <label htmlFor="template-name" className="text-xs text-[var(--text-secondary)] ml-1">Class name</label>
              <input
                id="template-name"
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
              <p id="template-days-label" className="text-xs text-[var(--text-secondary)] ml-1">Days of the week</p>
              <div className="flex flex-wrap gap-2" role="group" aria-labelledby="template-days-label">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                  const isSelected = selectedDays.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedDays(prev => 
                          prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
                        );
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border",
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
                <label htmlFor="template-start" className="text-xs text-[var(--text-secondary)] ml-1">Start time</label>
                <input
                  id="template-start"
                  required
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all cursor-pointer"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="template-end" className="text-xs text-[var(--text-secondary)] ml-1">End time</label>
                <input
                  id="template-end"
                  required
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20 transition-all cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="template-trainer" className="text-xs text-[var(--text-secondary)] ml-1">Coach (optional)</label>
              <input
                id="template-trainer"
                type="text"
                value={trainer}
                onChange={(e) => setTrainer && setTrainer(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20"
                placeholder="e.g. Coach Nasser"
              />
            </div>

            {/* Capacity: optional, since the official timetable does not state class sizes */}
            <div className="space-y-2">
              <label htmlFor="template-capacity" className="text-xs text-[var(--text-secondary)] ml-1">
                Max class size (optional)
              </label>
              <input
                id="template-capacity"
                type="number"
                min="1"
                max="200"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-primary)]/20"
                placeholder="No limit"
              />
            </div>
          </div>

          {error && <p role="alert" className="text-xs text-danger">{error}</p>}
          <div className="pt-4 flex gap-4">
            <button 
              type="submit"
              disabled={saving}
              className="flex-grow py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {saving ? 'Saving…' : editingTemplate ? 'Save Changes' : 'Create Template'}
            </button>
            <button 
              type="button"
              onClick={handleCloseModal}
              className="px-8 py-4 rounded-2xl glass-card text-xs font-bold border-[var(--glass-border)] hover:bg-[var(--card-hover)]"
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
