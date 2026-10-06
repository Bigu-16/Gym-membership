import React from 'react';

const LiveSessionsCard = ({
  allSessions = [],
  selectedDate = new Date(),
  onSelectDate,
  onTabChange,
  handleToggleSessionStatus,
  handleToggleChecklist,
  handleDeleteChecklistItem,
  handleAddChecklistItem
}) => {
  const today = new Date();
  const isSelectedToday = (
    selectedDate.getDate() === today.getDate() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getFullYear() === today.getFullYear()
  );

  // Generate next 7 days for quick day selection
  const dayTabs = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    let label = d.toLocaleDateString('en-US', { weekday: 'short' });
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';

    const isCurrent = (
      d.getDate() === selectedDate.getDate() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getFullYear() === selectedDate.getFullYear()
    );

    return {
      date: d,
      label,
      dateNum: d.getDate(),
      monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
      isCurrent
    };
  });

  const formattedSelectedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Top Header & Manage Schedule Link */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isSelectedToday ? 'bg-emerald-500 animate-pulse' : 'bg-[var(--accent-color)]'}`}></span>
            {isSelectedToday ? 'Live Session Control Center' : 'Scheduled Sessions'}
          </h2>
          <p className="text-[11px] font-medium text-[var(--text-primary)] opacity-80 mt-0.5">
            {isSelectedToday ? `Today • ${formattedSelectedDate}` : formattedSelectedDate}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-luxury px-2.5 py-1 rounded-full bg-[var(--glass-border)] text-[var(--text-secondary)] font-semibold">
            {allSessions.length} {allSessions.length === 1 ? 'Class' : 'Classes'}
          </span>
          <button 
            type="button"
            onClick={() => onTabChange('schedule')}
            className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
          >
            Manage Schedule 
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day Selector Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {dayTabs.map((tab, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectDate && onSelectDate(tab.date)}
            className={`px-3.5 py-2 rounded-xl text-xs flex flex-col items-center min-w-[70px] transition-all duration-200 border ${
              tab.isCurrent
                ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent font-bold shadow-md scale-105'
                : 'bg-[var(--glass-bg)] border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-primary)]/40'
            }`}
          >
            <span className="text-[9px] uppercase tracking-luxury font-bold opacity-80">{tab.label}</span>
            <span className="text-xs font-semibold">{tab.monthShort} {tab.dateNum}</span>
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {allSessions.length === 0 ? (
          <div className="glass-card p-10 border border-[var(--glass-border)] rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[var(--glass-border)] flex items-center justify-center text-[var(--text-secondary)]">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold tracking-wide text-[var(--text-primary)]">
                No Sessions Scheduled for {formattedSelectedDate}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                There are no live or pre-set classes booked on this date.
              </p>
            </div>
            {!isSelectedToday && (
              <button
                type="button"
                onClick={() => onSelectDate && onSelectDate(new Date())}
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-luxury font-bold bg-[var(--text-primary)] text-[var(--bg-primary)] hover:scale-105 transition-all shadow-md"
              >
                Back to Today's Sessions
              </button>
            )}
          </div>
        ) : (
          allSessions.map((session) => {
            const isProgress = session.status === 'in-progress';
            const sessionChecklist = session.checklist || [];
            const totalTasks = sessionChecklist.length;
            const completedTasks = sessionChecklist.filter(item => item.checked).length;
            const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            return (
              <div 
                key={session.id} 
                className={`glass-card p-6 border transition-all duration-300 ${
                  isProgress 
                    ? 'border-[var(--text-primary)] shadow-[0_0_25px_rgba(255,255,255,0.02)]' 
                    : 'border-[var(--glass-border)]'
                }`}
              >
              <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-xl font-light tracking-wide">{session.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-[8px] uppercase tracking-luxury font-bold ${
                      isProgress 
                        ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 animate-pulse' 
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}>
                      {isProgress ? 'In Progress' : 'Upcoming'}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] uppercase tracking-luxury font-medium flex items-center gap-2 flex-wrap">
                    <span>{session.trainer} • <span className="opacity-70">{session.location}</span></span>
                    {session.capacity && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-[var(--glass-border)] text-[var(--text-primary)] font-bold">
                        {session.enrolled || 0}/{session.capacity} Enrolled
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="text-right flex flex-col items-end gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block">Session Slot</span>
                    <span className="text-xs font-semibold">
                      {new Date(session.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(session.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleSessionStatus(session)}
                    className={`px-3.5 py-1.5 rounded-xl text-[9px] uppercase tracking-luxury font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-1.5 border ${
                      isProgress
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500 hover:text-white'
                        : 'bg-[var(--text-primary)] text-[var(--bg-primary)] border-transparent hover:opacity-90'
                    }`}
                  >
                    {isProgress ? (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Pause Session
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Start Session
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Checklist & Micro-Tasks */}
              <div className="mt-6 pt-4 border-t border-[var(--glass-border)]">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold">Trainer Protocol Checklist</span>
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)]">{completedTasks}/{totalTasks} Completed</span>
                </div>
                
                {totalTasks > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {sessionChecklist.map((item, index) => (
                      <div 
                        key={`${item.id || index}-${index}`} 
                        className={`flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs transition-all duration-300 group/item ${
                          item.checked 
                            ? 'bg-[var(--card-hover)] border-emerald-500/20 text-[var(--text-primary)] opacity-70' 
                            : 'bg-transparent border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]/40'
                        }`}
                      >
                        <label className="flex items-center gap-3 cursor-pointer flex-grow select-none">
                          <input 
                            type="checkbox" 
                            checked={item.checked} 
                            onChange={() => handleToggleChecklist(session.id, item.id, index)}
                            className="w-4 h-4 rounded border-[var(--glass-border)] accent-[var(--text-primary)] bg-transparent cursor-pointer"
                          />
                          <span className={item.checked ? 'line-through' : ''}>{item.text}</span>
                        </label>
                        <button 
                          type="button"
                          onClick={() => handleDeleteChecklistItem(session.id, item.id, index)}
                          className="text-[var(--text-secondary)] hover:text-rose-500 transition-colors p-1 rounded-md opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                          title="Delete task"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] opacity-60 italic mb-4">
                    No custom protocol tasks assigned for this session. Add one below!
                  </p>
                )}

                {totalTasks > 0 && (
                  <div className="w-full h-1 bg-[var(--glass-border)] rounded-full overflow-hidden mb-4">
                    <div 
                      className="h-full bg-[var(--text-primary)] transition-all duration-500"
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                )}

                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = e.target.elements.newItemText;
                    handleAddChecklistItem(session.id, input.value);
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

            </div>
          );
        })
      )}
      </div>
    </div>
  );
};

export default LiveSessionsCard;
