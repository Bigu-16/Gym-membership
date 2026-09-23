import React from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  MoreHorizontal, 
  Play, 
  Timer, 
  Users, 
  X 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const SessionModal = ({
  selectedSession,
  setSelectedSession,
  localChecklists = {},
  handleToggleChecklist,
  handleDeleteChecklistItem,
  handleAddChecklistItem,
  members = [],
  timeLeft,
  onUpdateSessionStatus
}) => {
  if (!selectedSession) return null;

  const sessionChecklist = localChecklists[selectedSession.id] || selectedSession.checklist || [];
  const totalTasks = sessionChecklist.length;
  const completedTasks = sessionChecklist.filter(item => item.checked).length;

  const sTitle = (selectedSession.title || '').toLowerCase();
  const enrolledTrainees = (members || []).filter(m => {
    if (selectedSession.template_id && m.enrolledClass?.id === selectedSession.template_id) return true;
    if (m.enrolledClass?.className && m.enrolledClass.className.toLowerCase() === sTitle) return true;
    if (m.schedule?.slot && m.schedule.slot.toLowerCase().includes(sTitle)) return true;
    if (m.plan && m.plan.toLowerCase() === sTitle) return true;
    return false;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-4 bg-black bg-opacity-40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md h-full glass-card p-8 shadow-2xl relative flex flex-col animate-in slide-in-from-right duration-500 border-[var(--glass-border)] bg-[var(--bg-secondary)]">
        <button 
          onClick={() => setSelectedSession(null)}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-[var(--glass-border)] transition-all"
        >
          <MoreHorizontal />
        </button>
        
        <div className="mb-8">
          <span className={cn(
            "px-4 py-1.5 rounded-full text-[10px] uppercase tracking-luxury font-bold mb-4 inline-block",
            selectedSession.status === 'in-progress' ? "bg-[var(--accent-color)] text-white" : "bg-[var(--glass-border)]"
          )}>
            {selectedSession.status.replace('-', ' ')}
          </span>
          <h2 className="text-3xl font-light tracking-luxury uppercase mb-2">{selectedSession.title}</h2>
          <div className="flex items-center gap-4 text-[var(--text-secondary)] text-sm">
            <span className="flex items-center gap-1.5"><Play size={14} /> {selectedSession.trainer}</span>
            <span className="flex items-center gap-1.5"><MapPin size={14} /> {selectedSession.location}</span>
          </div>
        </div>

        <div className="space-y-6 flex-grow overflow-y-auto pr-1 custom-scrollbar">
          {/* Session Checklist */}
          <div className="bg-[var(--bg-primary)] p-6 rounded-[32px] border border-[var(--glass-border)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs uppercase tracking-luxury font-bold">Session Checklist</h3>
              <span className="text-[10px] text-[var(--text-secondary)]">
                {completedTasks} / {totalTasks}
              </span>
            </div>
            <div className="space-y-3 mb-4">
              {sessionChecklist.length > 0 ? sessionChecklist.map((item, index) => (
                <div key={item.id ?? index} className="flex items-center justify-between group cursor-pointer">
                  <div 
                    onClick={() => handleToggleChecklist(selectedSession.id, item.id, index)}
                    className="flex items-center gap-3 flex-grow"
                  >
                    <div className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                      item.checked ? "bg-[var(--accent-color)] border-transparent" : "border-[var(--glass-border)] group-hover:border-[var(--text-secondary)]"
                    )}>
                      {item.checked && <CheckCircle2 size={12} className="text-white" />}
                    </div>
                    <span className={cn(
                      "text-sm transition-all select-none",
                      item.checked ? "text-[var(--text-secondary)] line-through" : "text-[var(--text-primary)]"
                    )}>
                      {item.text}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleDeleteChecklistItem(selectedSession.id, item.id, index)}
                    className="text-[var(--text-secondary)] hover:text-rose-500 transition-colors p-1 rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100"
                    title="Delete task"
                  >
                    <X size={14} />
                  </button>
                </div>
              )) : (
                <p className="text-xs text-[var(--text-secondary)] opacity-60 italic">No tasks assigned for today. Add one below!</p>
              )}
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const input = e.target.elements.newItemText;
                handleAddChecklistItem(selectedSession.id, input.value);
                input.value = '';
              }}
              className="flex gap-2"
            >
              <input 
                type="text" 
                required
                name="newItemText"
                placeholder="Add custom daily activity..." 
                className="flex-grow bg-[var(--card-hover)] border border-[var(--glass-border)] rounded-xl px-3 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder:text-[var(--text-secondary)] placeholder:opacity-50"
              />
              <button 
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all"
              >
                Add
              </button>
            </form>
          </div>

          {/* Enrolled Trainees */}
          <div className="bg-[var(--bg-primary)] p-6 rounded-[32px] border border-[var(--glass-border)]">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[var(--text-secondary)]" />
                <h3 className="text-xs uppercase tracking-luxury font-bold">Enrolled Trainees</h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--glass-border)] text-[var(--text-primary)]">
                {enrolledTrainees.length} {selectedSession.capacity ? `/ ${selectedSession.capacity}` : ''}
              </span>
            </div>

            {enrolledTrainees.length === 0 ? (
              <p className="text-[11px] text-[var(--text-secondary)] italic">No trainees enrolled in this class yet.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                {enrolledTrainees.map(trainee => (
                  <div key={trainee.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                    <div className="flex items-center gap-3">
                      <img 
                        src={trainee.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(trainee.name)}&background=random&color=fff`} 
                        alt={trainee.name} 
                        className="w-8 h-8 rounded-full object-cover border border-[var(--glass-border)]" 
                      />
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-primary)] leading-tight">{trainee.name}</p>
                        <p className="text-[9px] text-[var(--text-secondary)]">
                          {trainee.parentName ? `Parent: ${trainee.parentName}` : trainee.phone}
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] uppercase tracking-luxury px-2 py-0.5 rounded-md font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                      Enrolled
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedSession.status === 'in-progress' && (
            <div className="glass-card p-6 border-[var(--accent-color)] border-opacity-30 bg-[var(--accent-color)] bg-opacity-5">
              <div className="flex items-center gap-3 mb-4">
                <Timer size={20} className="text-[var(--accent-color)]" />
                <span className="text-xs uppercase tracking-luxury font-bold text-[var(--accent-color)]">Time Remaining</span>
              </div>
              <div className="text-4xl font-mono font-bold tracking-tighter mb-4">{timeLeft.replace(' remaining', '')}</div>
              <div className="h-2 bg-[var(--glass-border)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent-color)]" style={{ width: '65%' }}></div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex gap-4">
          <button 
            onClick={() => {
              const newStatus = selectedSession.status === 'in-progress' ? 'upcoming' : 'in-progress';
              if (onUpdateSessionStatus) {
                onUpdateSessionStatus(selectedSession.id, newStatus);
              }
              setSelectedSession(prev => ({ ...prev, status: newStatus }));
            }}
            className="flex-grow py-4 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold hover:opacity-90 transition-all"
          >
            {selectedSession.status === 'in-progress' ? 'Pause Session' : 'Start Session'}
          </button>
          <button 
            onClick={() => setSelectedSession(null)}
            className="px-8 py-4 rounded-2xl glass-card text-[10px] uppercase tracking-luxury font-bold border-[var(--glass-border)] hover:bg-[var(--card-hover)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionModal;
