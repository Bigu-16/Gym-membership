import React, { useState, useEffect } from 'react';

const DashboardOverview = ({ members, sessions, setSessions, scheduleTemplates = [], onTabChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(null);
  const [inClubList, setInClubList] = useState([1, 4]); // Member IDs currently in the club
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [localChecklists, setLocalChecklists] = useState({});

  // Merge custom sessions with mapped schedule templates to represent live scheduled classes (e.g. Muay Thai, Taekwondo, Fitness)
  const allSessions = React.useMemo(() => {
    const templateSessions = (scheduleTemplates || []).map(template => {
      if (!template) return null;
      const templateTitle = (template.className || '').toLowerCase();
      
      // Avoid duplicate titles if already exists in mock sessions
      if (sessions.some(s => (s.title || '').toLowerCase() === templateTitle)) {
        return null;
      }
      
      // Parse time string e.g. "4:00 PM - 5:00 PM"
      const parseTimePart = (str) => {
        if (!str) return new Date();
        const parts = str.split(' ');
        const timePart = parts[0] || '00:00';
        const ampm = parts[1] || 'AM';
        let [hours, minutes] = timePart.split(':').map(Number);
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
      };

      let start = new Date();
      let end = new Date(Date.now() + 60 * 60 * 1000);
      try {
        if (template.time && template.time.includes(' - ')) {
          const [startStr, endStr] = template.time.split(' - ');
          start = parseTimePart(startStr);
          end = parseTimePart(endStr);
        }
      } catch (e) {
        // Fallback
      }

      // Assign premium trainer based on class type
      let trainer = "Marcus Thorne";
      if (templateTitle.includes("yoga")) trainer = "Sophia Chen";
      if (templateTitle.includes("taekwondo")) trainer = "Master Kim";
      if (templateTitle.includes("muay") || templateTitle.includes("thai")) trainer = "Coach Somchai";
      if (templateTitle.includes("fitness")) trainer = "Elena Vance";

      return {
        id: `template-${template.id}`,
        title: template.className || 'Group Class',
        trainer: trainer,
        location: templateTitle.includes("yoga") ? 'Zen Garden' : 'Studio B - Group Floor',
        start: start,
        end: end,
        status: start < new Date() && end > new Date() ? 'in-progress' : 'upcoming', // Group classes are upcoming today
        type: 'group',
        checklist: [
          { id: 1, text: 'Safety warm-up completed', checked: false },
          { id: 2, text: 'Core group training sequence', checked: false },
          { id: 3, text: 'Assisted stretching session', checked: false }
        ]
      };
    }).filter(Boolean);

    return [...(sessions || []), ...templateSessions];
  }, [sessions, scheduleTemplates]);

  // Helper to resolve category name for a session
  const getSessionCategory = (session) => {
    if (!session) return 'General';
    const title = (session.title || '').toLowerCase();
    if (title.includes('taekwondo')) return 'Taekwondo';
    if (title.includes('yoga')) return 'Yoga';
    if (title.includes('muay') || title.includes('thai')) return 'Muay Thai';
    if (title.includes('fitness')) return 'Fitness';
    if (title.includes('personal') || title.includes('trainer')) return 'Personal Training';
    if (title.includes('elite') || title.includes('performance')) return 'Elite Performance';
    return 'General';
  };

  // Derive unique categories from active sessions
  const categories = React.useMemo(() => {
    const list = ['All'];
    allSessions.forEach(session => {
      const cat = getSessionCategory(session);
      if (!list.includes(cat)) {
        list.push(cat);
      }
    });
    return list;
  }, [allSessions]);

  // Filter sessions by selected category
  const filteredSessionsByCat = React.useMemo(() => {
    if (selectedCategory === 'All') return allSessions;
    return allSessions.filter(s => getSessionCategory(s) === selectedCategory);
  }, [allSessions, selectedCategory]);

  // Get members scheduled for any session in the selected category
  const categoryRosterMembers = React.useMemo(() => {
    const uniqueMembers = [];
    members.forEach(member => {
      const matchesAnySession = filteredSessionsByCat.some(session => {
        const planName = (member.plan || '').toLowerCase();
        const sessionTitle = (session.title || '').toLowerCase();
        
        if (planName && sessionTitle && (planName.includes(sessionTitle) || sessionTitle.includes(planName))) return true;
        
        if (member.schedule?.slot) {
          const slotText = (member.schedule.slot || '').toLowerCase();
          if (slotText && sessionTitle && (slotText.includes(sessionTitle) || sessionTitle.includes(slotText))) return true;
        }
        return false;
      });

      if (matchesAnySession) {
        uniqueMembers.push(member);
      }
    });
    return uniqueMembers;
  }, [filteredSessionsByCat, members]);

  // Toggle checklist item for sessions
  const handleToggleChecklist = (sessionId, itemId) => {
    if (typeof sessionId === 'string' && sessionId.startsWith('template-')) {
      setLocalChecklists(prev => {
        const checkedList = prev[sessionId] || [];
        const exists = checkedList.includes(itemId);
        return {
          ...prev,
          [sessionId]: exists 
            ? checkedList.filter(id => id !== itemId) 
            : [...checkedList, itemId]
        };
      });
      return;
    }

    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          checklist: session.checklist.map(item => {
            if (item.id === itemId) {
              return { ...item, checked: !item.checked };
            }
            return item;
          })
        };
      }
      return session;
    }));
  };

  // Check in a member
  const handleCheckIn = (memberId) => {
    if (inClubList.includes(memberId)) {
      // Already checked in, show notification but don't duplicate
      const member = members.find(m => m.id === memberId);
      setShowCheckInSuccess(`${member.name} is already checked in.`);
      setTimeout(() => setShowCheckInSuccess(null), 3000);
      return;
    }
    
    setInClubList(prev => [...prev, memberId]);
    const member = members.find(m => m.id === memberId);
    setShowCheckInSuccess(`Successfully checked in ${member.name}!`);
    setSearchTerm('');
    setTimeout(() => setShowCheckInSuccess(null), 3000);
  };

  // Check out a member
  const handleCheckOut = (memberId) => {
    setInClubList(prev => prev.filter(id => id !== memberId));
    const member = members.find(m => m.id === memberId);
    setShowCheckInSuccess(`${member.name} has been checked out.`);
    setTimeout(() => setShowCheckInSuccess(null), 3000);
  };

  // Filter members for the search dropdown
  const filteredMembers = searchTerm.trim() === '' 
    ? [] 
    : members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

  // Active sessions counts from all combined classes
  const activeSessionsCount = allSessions.filter(s => s.status === 'in-progress').length;
  const upcomingSessionsCount = allSessions.filter(s => s.status === 'upcoming').length;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Toast Notification */}
      {showCheckInSuccess && (
        <div className="fixed bottom-8 right-8 z-50 glass-card px-6 py-4 border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)] flex items-center gap-3 animate-slide-up">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></div>
          <span className="text-xs font-semibold uppercase tracking-luxury text-[var(--text-primary)]">
            {showCheckInSuccess}
          </span>
        </div>
      )}

      {/* Grid of Key Performance Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Members */}
        <div 
          onClick={() => onTabChange('members')}
          className="glass-card p-6 cursor-pointer hover:border-[var(--text-primary)] group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Active Directory</span>
              <span className="text-3xl font-light tracking-wide">{members.length} <span className="text-xs text-[var(--text-secondary)]">Registered</span></span>
            </div>
            <div className="p-3 bg-[var(--card-hover)] rounded-xl group-hover:bg-[var(--text-primary)] group-hover:text-[var(--bg-primary)] transition-all duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-9 9-4-4-6 6" />
            </svg>
            <span className="text-[10px] uppercase tracking-luxury text-emerald-500 font-bold">+8% this week</span>
          </div>
          {/* Subtle line background chart in pure SVG */}
          <div className="absolute bottom-0 left-0 w-full h-8 opacity-20 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0 20 C20 15, 40 18, 60 10 C80 5, 90 8, 100 2 L100 20 L0 20 Z" fill="var(--text-secondary)" />
            </svg>
          </div>
        </div>

        {/* Live Attendance */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Live Occupancy</span>
              <span className="text-3xl font-light tracking-wide">{inClubList.length} <span className="text-xs text-[var(--text-secondary)]">In Club</span></span>
            </div>
            <div className="p-3 bg-[var(--card-hover)] rounded-xl flex items-center justify-center">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] font-medium">
              ~{Math.round((inClubList.length / 30) * 100)}% Capacity reached
            </span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-8 opacity-20 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0 15 Q25 5, 50 18 T100 10 L100 20 L0 20 Z" fill="var(--accent-color)" />
            </svg>
          </div>
        </div>

        {/* Sessions Today */}
        <div 
          onClick={() => onTabChange('schedule')}
          className="glass-card p-6 cursor-pointer hover:border-[var(--text-primary)] group relative overflow-hidden"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Today's Sessions</span>
              <span className="text-3xl font-light tracking-wide">{allSessions.length} <span className="text-xs text-[var(--text-secondary)]">Scheduled</span></span>
            </div>
            <div className="p-3 bg-[var(--card-hover)] rounded-xl group-hover:bg-[var(--text-primary)] group-hover:text-[var(--bg-primary)] transition-all duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] uppercase tracking-luxury text-amber-500 font-bold">
              {activeSessionsCount} in-progress • {upcomingSessionsCount} upcoming
            </span>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-8 opacity-20 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 20" preserveAspectRatio="none">
              <path d="M0 18 Q30 2, 70 12 T100 5 L100 20 L0 20 Z" fill="var(--text-secondary)" />
            </svg>
          </div>
        </div>

        {/* Active Trainers */}
        <div className="glass-card p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block mb-1">Active Coaching</span>
              <span className="text-3xl font-light tracking-wide">3 <span className="text-xs text-[var(--text-secondary)]">On Duty</span></span>
            </div>
            <div className="p-3 bg-[var(--card-hover)] rounded-xl">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="flex -space-x-2 overflow-hidden mt-2">
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[var(--bg-primary)] bg-neutral-800 text-[10px] flex items-center justify-center font-bold">MT</div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[var(--bg-primary)] bg-emerald-800 text-[10px] flex items-center justify-center font-bold">EV</div>
            <div className="inline-block h-6 w-6 rounded-full ring-2 ring-[var(--bg-primary)] bg-indigo-800 text-[10px] flex items-center justify-center font-bold">SC</div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Live Class Stream Command Center */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-color)]"></span> Live Session Control Center
            </h2>
            <button 
              onClick={() => onTabChange('schedule')}
              className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
            >
              Manage Schedule 
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {allSessions.map((session) => {
              const isProgress = session.status === 'in-progress';
              const totalTasks = session.checklist?.length || 0;
              const completedTasks = session.checklist?.filter(item => {
                return typeof session.id === 'string' && session.id.startsWith('template-')
                  ? (localChecklists[session.id]?.includes(item.id) || false)
                  : item.checked;
              }).length || 0;
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
                      <p className="text-xs text-[var(--text-secondary)] uppercase tracking-luxury font-medium">
                        {session.trainer} • <span className="opacity-70">{session.location}</span>
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] block">Session Slot</span>
                      <span className="text-xs font-semibold">
                        {new Date(session.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(session.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>

                  {/* Checklist & Micro-Tasks */}
                  {totalTasks > 0 && (
                    <div className="mt-6 pt-4 border-t border-[var(--glass-border)]">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] uppercase tracking-luxury text-[var(--text-secondary)] font-bold">Trainer Protocol Checklist</span>
                        <span className="text-[10px] font-semibold text-[var(--text-secondary)]">{completedTasks}/{totalTasks} Completed</span>
                      </div>
                      
                      {/* Interactive Checkboxes */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        {session.checklist.map((item) => {
                          const isChecked = typeof session.id === 'string' && session.id.startsWith('template-')
                            ? (localChecklists[session.id]?.includes(item.id) || false)
                            : item.checked;

                          return (
                            <label 
                              key={item.id} 
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-xs transition-all duration-300 cursor-pointer ${
                                isChecked 
                                  ? 'bg-[var(--card-hover)] border-emerald-500/20 text-[var(--text-primary)] opacity-70' 
                                  : 'bg-transparent border-[var(--glass-border)] text-[var(--text-secondary)] hover:border-[var(--text-primary)]'
                              }`}
                            >
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => handleToggleChecklist(session.id, item.id)}
                                className="w-4 h-4 rounded border-[var(--glass-border)] accent-[var(--text-primary)] bg-transparent cursor-pointer"
                              />
                              <span className={isChecked ? 'line-through' : ''}>{item.text}</span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Custom checklist progress bar */}
                      <div className="w-full h-1 bg-[var(--glass-border)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[var(--text-primary)] transition-all duration-500"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* No checklist items state */}
                  {totalTasks === 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--glass-border)] text-center py-2">
                      <p className="text-[10px] uppercase tracking-luxury text-[var(--text-secondary)] italic">
                        No custom protocol tasks assigned for this template
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Desk Check-In Center & Club Zones */}
        <div className="space-y-8">
          {/* Desk Check-In Center Widget */}
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
                /* Search Results View */
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
                /* Category Roster View */
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

            {/* Currently In Gym Avatars */}
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

          {/* Zone Occupancy Hotspots */}
          <div className="glass-card p-6 border border-[var(--glass-border)]">
            <h3 className="text-xs uppercase tracking-luxury text-[var(--text-secondary)] font-semibold mb-5 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Zone Density Monitor
            </h3>

            <div className="space-y-4">
              {/* Zone 1 */}
              <div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-luxury mb-1.5">
                  <span className="font-semibold text-[var(--text-primary)] opacity-80">Main Lifting Floor</span>
                  <span className="text-rose-500 font-bold">82% Peak</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--glass-border)] rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>

              {/* Zone 2 */}
              <div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-luxury mb-1.5">
                  <span className="font-semibold text-[var(--text-primary)] opacity-80">Cardio Loft</span>
                  <span className="text-amber-500 font-bold">55% Moderate</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--glass-border)] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '55%' }}></div>
                </div>
              </div>

              {/* Zone 3 */}
              <div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-luxury mb-1.5">
                  <span className="font-semibold text-[var(--text-primary)] opacity-80">Zen Yoga Studio</span>
                  <span className="text-emerald-500 font-bold">20% Serene</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--glass-border)] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '20%' }}></div>
                </div>
              </div>

              {/* Zone 4 */}
              <div>
                <div className="flex justify-between items-center text-[10px] uppercase tracking-luxury mb-1.5">
                  <span className="font-semibold text-[var(--text-primary)] opacity-80">Cryo & Spa Suite</span>
                  <span className="text-indigo-400 font-bold">40% Chilled</span>
                </div>
                <div className="w-full h-1.5 bg-[var(--glass-border)] rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[var(--glass-border)] text-center">
              <span className="text-[8px] uppercase tracking-luxury text-[var(--text-secondary)] font-medium">
                Density updates automatically every 5 mins
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
