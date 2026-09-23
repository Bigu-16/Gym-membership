import React from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs) => twMerge(clsx(inputs));

const TemplatesView = ({
  scheduleTemplates = [],
  members = [],
  selectedTemplateCategory,
  setSelectedTemplateCategory,
  setIsCreateModalOpen,
  handleEditClick,
  setDeleteTemplateId
}) => {
  const categories = ['All', ...Array.from(new Set(scheduleTemplates.map(t => t.className || 'General Classes')))];

  const grouped = scheduleTemplates.reduce((acc, t) => {
    const cName = t.className || 'General Classes';
    if (!acc[cName]) acc[cName] = [];
    acc[cName].push(t);
    return acc;
  }, {});

  const filteredGrouped = Object.entries(grouped).filter(([cName]) => {
    if (selectedTemplateCategory === 'All') return true;
    return cName === selectedTemplateCategory;
  });

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Templates Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--glass-bg)] border border-[var(--glass-border)] rounded-3xl p-6">
        <div>
          <h3 className="text-lg font-light tracking-luxury uppercase mb-1">Active Class Templates</h3>
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">Create and manage recurring schedule options for group enrollment</p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--text-primary)] text-[var(--bg-primary)] text-[10px] uppercase tracking-luxury font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
        >
          <Plus size={14} /> Create Template
        </button>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map(cat => {
          const isActive = selectedTemplateCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedTemplateCategory(cat)}
              className={`px-4 py-2 rounded-full text-[10px] uppercase tracking-luxury font-bold whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md' 
                  : 'bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--glass-border)]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Grouped Templates Grid */}
      {filteredGrouped.map(([cName, slots]) => (
        <div key={cName} className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-[var(--text-primary)] rounded-full opacity-60"></div>
            <h3 className="text-sm uppercase tracking-luxury font-bold text-[var(--text-primary)] opacity-80">{cName}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {slots.map(template => {
              const slotText = `${cName}: ${template.days} @ ${template.time}`;
              const enrolledMembers = members.filter(m => m.schedule?.slot === slotText);
              const enrolledCount = enrolledMembers.length || template.enrolled || 0;
              const isFull = enrolledCount >= template.capacity;

              return (
                <div 
                  key={template.id}
                  className="glass-card p-6 border-[var(--glass-border)] relative overflow-hidden flex flex-col justify-between group hover:border-[var(--text-primary)]/40 hover:translate-y-[-4px] transition-all duration-300 min-h-[220px]"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[var(--text-primary)]/5 to-transparent rounded-bl-full pointer-events-none transition-all group-hover:scale-110"></div>

                  <div>
                    <div className="flex justify-between items-center mb-4 relative z-10">
                      <span className="text-[9px] uppercase tracking-luxury px-3 py-1 rounded-full bg-[var(--glass-border)] font-bold text-[var(--text-secondary)]">
                        Slot #{template.id}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          type="button"
                          onClick={() => handleEditClick(template)}
                          className="p-2 rounded-xl bg-[var(--text-primary)]/10 text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-[var(--bg-primary)] transition-all"
                          title="Edit Template"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTemplateId(template.id)}
                          className="p-2 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                          title="Delete Template"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-6 relative z-10">
                      <h4 className="text-2xl font-bold tracking-tight mb-1 flex items-center gap-2">
                        <Clock size={18} className="opacity-60 text-[var(--text-primary)]" />
                        {template.time}
                      </h4>
                      <p className="text-sm font-light text-[var(--text-secondary)] tracking-wide">
                        {template.days}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    <div>
                      <div className="flex justify-between text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] mb-1.5">
                        <span>Capacity Progress</span>
                        <span className={cn("font-bold", isFull ? "text-rose-500" : "text-emerald-500")}>
                          {enrolledCount} / {template.capacity} {isFull ? '(FULL)' : ''}
                        </span>
                      </div>
                      <div className="h-1.5 bg-[var(--glass-border)] rounded-full overflow-hidden">
                        <div 
                          className={cn("h-full transition-all duration-1000", isFull ? "bg-rose-500 animate-pulse" : "bg-emerald-500")}
                          style={{ width: `${Math.min(100, (enrolledCount / template.capacity) * 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[var(--glass-border)] border-dashed">
                      <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)]">Enrolled Members</span>
                      {enrolledMembers.length > 0 ? (
                        <div className="flex items-center">
                          <div className="flex -space-x-2 mr-2">
                            {enrolledMembers.slice(0, 3).map((member) => (
                              <img
                                key={member.id}
                                src={member.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff`}
                                alt={member.name}
                                title={member.name}
                                className="w-6 h-6 rounded-full border border-[var(--bg-primary)] object-cover shadow-sm"
                              />
                            ))}
                          </div>
                          {enrolledMembers.length > 3 && (
                            <span className="text-[8px] font-bold text-[var(--text-secondary)] px-1.5 py-0.5 rounded bg-[var(--glass-border)]">
                              +{enrolledMembers.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[9px] font-light text-[var(--text-secondary)] opacity-60">No members enrolled</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Global Add Template Placeholder Button Card */}
      <div 
        onClick={() => setIsCreateModalOpen(true)}
        className="glass-card p-8 border-dashed border-2 border-[var(--glass-border)] hover:border-[var(--text-primary)]/40 hover:bg-[var(--card-hover)] cursor-pointer flex flex-col items-center justify-center min-h-[140px] transition-all group duration-300"
      >
        <div className="w-10 h-10 rounded-full bg-[var(--glass-border)] flex items-center justify-center text-[var(--text-secondary)] group-hover:scale-110 group-hover:text-[var(--text-primary)] group-hover:bg-[var(--text-primary)]/10 transition-all mb-3">
          <Plus size={18} />
        </div>
        <span className="text-xs uppercase tracking-luxury font-bold">Add Another Template Class Slot</span>
      </div>
    </div>
  );
};

export default TemplatesView;
