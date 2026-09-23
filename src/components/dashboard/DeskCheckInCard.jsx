import React from 'react';

const DeskCheckInCard = ({
  searchTerm,
  setSearchTerm,
  categories = [],
  selectedCategory,
  setSelectedCategory,
  filteredMembers = [],
  categoryRosterMembers = [],
  inClubList = [],
  members = [],
  handleCheckIn,
  handleCheckOut
}) => {
  return (
    <div className="glass-card p-6 border border-[var(--glass-border)] relative overflow-hidden">
      <h3 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold mb-4 flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        Desk Check-In Center
      </h3>

      <p className="text-xs text-[var(--text-secondary)] mb-4">
        Search by name for walk-ins, or filter by category to check in pre-booked members.
      </p>

      {/* Fast Search Input */}
      <div className="relative mb-5">
        <input 
          type="text" 
          placeholder="Search member name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[var(--card-hover)] border border-[var(--glass-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors placeholder:text-[var(--text-secondary)] placeholder:opacity-50"
        />
        {searchTerm && (
          <button 
            type="button"
            onClick={() => setSearchTerm('')} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Clear
          </button>
        )}
      </div>

      {/* Render Category Tabs only if NOT searching */}
      {!searchTerm && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {categories.map(cat => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[9px] uppercase tracking-luxury font-bold whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-md' 
                    : 'bg-[var(--card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--glass-border)]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Dynamic Attendance List (Search Results OR Category Rosters) */}
      <div className="space-y-3 mb-6">
        {searchTerm ? (
          filteredMembers.length === 0 ? (
            <p className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] italic text-center py-4 border border-dashed border-[var(--glass-border)] rounded-xl">
              No matching members found.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {filteredMembers.map(member => {
                const isCheckedIn = inClubList.includes(member.id);
                return (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--glass-border)] hover:bg-[var(--card-hover)] transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-7 h-7 rounded-full object-cover grayscale border border-[var(--glass-border)]"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=64`;
                        }}
                      />
                      <div>
                        <span className="text-xs font-semibold text-[var(--text-primary)] block leading-none mb-0.5">{member.name}</span>
                        <span className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] leading-none">{member.plan}</span>
                      </div>
                    </div>

                    {isCheckedIn ? (
                      <span className="text-[9px] uppercase tracking-luxury text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/10">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        In Club
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          handleCheckIn(member.id);
                          setSearchTerm('');
                        }}
                        className="px-3 py-1 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[9px] uppercase tracking-luxury font-bold hover:scale-105 active:scale-95 transition-all"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          categoryRosterMembers.length === 0 ? (
            <p className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] italic text-center py-4 border border-dashed border-[var(--glass-border)] rounded-xl">
              No pre-booked members for this category today. Search name above for walk-ins.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {categoryRosterMembers.map(member => {
                const isCheckedIn = inClubList.includes(member.id);
                return (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--glass-border)] hover:bg-[var(--card-hover)] transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={member.image} 
                        alt={member.name}
                        className="w-7 h-7 rounded-full object-cover grayscale border border-[var(--glass-border)]"
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=64`;
                        }}
                      />
                      <div>
                        <span className="text-xs font-semibold text-[var(--text-primary)] block leading-none mb-0.5">{member.name}</span>
                        <span className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] leading-none">{member.plan}</span>
                      </div>
                    </div>

                    {isCheckedIn ? (
                      <span className="text-[9px] uppercase tracking-luxury text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/10">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        In Club
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCheckIn(member.id)}
                        className="px-3 py-1 rounded-full bg-[var(--text-primary)] text-[var(--bg-primary)] text-[9px] uppercase tracking-luxury font-bold hover:scale-105 active:scale-95 transition-all"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Currently In Gym Checked-in Members */}
      <div className="pt-4 border-t border-[var(--glass-border)]">
        <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold block mb-3">
          Checked-In Members ({inClubList.length})
        </span>
        
        {inClubList.length === 0 ? (
          <p className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] italic text-center py-2">
            No members checked in yet today
          </p>
        ) : (
          <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
            {inClubList.map(id => {
              const member = members.find(m => m.id === id);
              if (!member) return null;
              return (
                <div key={id} className="flex items-center justify-between p-2 rounded-xl hover:bg-[var(--card-hover)] transition-colors group">
                  <div className="flex items-center gap-3">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-7 h-7 rounded-full border border-[var(--glass-border)] object-cover grayscale"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff&size=64`;
                      }}
                    />
                    <div>
                      <span className="text-xs font-medium text-[var(--text-primary)] block leading-none mb-0.5">{member.name}</span>
                      <span className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] leading-none">{member.plan}</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => handleCheckOut(id)}
                    className="text-[9px] uppercase tracking-luxury text-rose-500 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 font-semibold"
                  >
                    Checkout
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeskCheckInCard;
