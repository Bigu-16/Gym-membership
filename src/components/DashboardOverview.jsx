import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api';
import DashboardMetrics from './dashboard/DashboardMetrics';
import LiveSessionsCard from './dashboard/LiveSessionsCard';
import DeskCheckInCard from './dashboard/DeskCheckInCard';
import RecentActivityLog from './dashboard/RecentActivityLog';

const DashboardOverview = ({ 
  members = [], 
  sessions = [], 
  setSessions, 
  scheduleTemplates = [], 
  onTabChange, 
  inClubList = [], 
  setInClubList, 
  onUpdateSessionStatus 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCheckInSuccess, setShowCheckInSuccess] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboardData = async () => {
      try {
        setLoadingStats(true);
        const [stats, activities] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getRecentActivities()
        ]);
        if (isMounted) {
          setDashboardStats(stats);
          setRecentActivities(activities);
        }
      } catch (err) {
        console.error('Failed to load dashboard stats/activities:', err);
      } finally {
        if (isMounted) {
          setLoadingStats(false);
        }
      }
    };

    fetchDashboardData();
    return () => {
      isMounted = false;
    };
  }, [inClubList, members.length, sessions.length]);

  const allSessions = useMemo(() => {
    const templateSessions = (scheduleTemplates || []).map(template => {
      if (!template) return null;
      const templateTitle = (template.className || '').toLowerCase();
      
      if (sessions.some(s => (s.title || '').toLowerCase() === templateTitle)) {
        return null;
      }
      
      const parseTimePart = (str) => {
        if (!str) return new Date();
        const trimmed = str.trim();
        let hours = 10;
        let minutes = 0;
        if (trimmed.toLowerCase().includes('am') || trimmed.toLowerCase().includes('pm')) {
          const parts = trimmed.split(/\s+/);
          const [h, m] = (parts[0] || '10:00').split(':').map(Number);
          const ampm = (parts[1] || 'AM').toUpperCase();
          hours = h % 12;
          if (ampm === 'PM') hours += 12;
          minutes = m || 0;
        } else if (trimmed.includes(':')) {
          const [h, m] = trimmed.split(':').map(Number);
          hours = isNaN(h) ? 10 : h;
          minutes = isNaN(m) ? 0 : m;
        }
        
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
        } else if (template.time) {
          start = parseTimePart(template.time);
          end = new Date(start.getTime() + 90 * 60 * 1000);
        }
      } catch (e) {
        // Fallback
      }

      let trainer = "Marcus Thorne";
      if (templateTitle.includes("karate")) trainer = "Coach Somchai";
      if (templateTitle.includes("taekwondo")) trainer = "Master Kim";
      if (templateTitle.includes("kickboxing")) trainer = "Elena Vance";
      if (templateTitle.includes("fitness") || templateTitle.includes("zumba")) trainer = "Marcus Thorne";

      let defaultChecklist = [
        { id: 1, text: 'Safety warm-up completed', checked: false },
        { id: 2, text: 'Core group training sequence', checked: false },
        { id: 3, text: 'Assisted stretching session', checked: false }
      ];
      try {
        const saved = localStorage.getItem(`gym_session_checklist_template-${template.id}`);
        if (saved) {
          defaultChecklist = JSON.parse(saved);
        }
      } catch (e) {}

      let defaultStatus = start < new Date() && end > new Date() ? 'in-progress' : 'upcoming';
      try {
        const savedStatus = localStorage.getItem(`gym_session_status_template-${template.id}`);
        if (savedStatus) {
          defaultStatus = savedStatus;
        }
      } catch (e) {}

      return {
        id: `template-${template.id}`,
        title: template.className || 'Group Class',
        trainer: trainer,
        location: templateTitle.includes("yoga") ? 'Zen Garden' : 'Studio B - Group Floor',
        start: start,
        end: end,
        status: defaultStatus,
        type: 'group',
        checklist: defaultChecklist
      };
    }).filter(Boolean);

    const enrichedSessions = (sessions || []).map(s => {
      let checklist = s.checklist;
      try {
        const saved = localStorage.getItem(`gym_session_checklist_${s.id}`);
        if (saved) {
          checklist = JSON.parse(saved);
        }
      } catch (e) {}
      let status = s.status;
      try {
        const savedStatus = localStorage.getItem(`gym_session_status_${s.id}`);
        if (savedStatus) {
          status = savedStatus;
        }
      } catch (e) {}
      return {
        ...s,
        ...(checklist ? { checklist } : {}),
        status: status || s.status
      };
    });

    return [...enrichedSessions, ...templateSessions];
  }, [sessions, scheduleTemplates]);

  const getSessionCategory = (session) => {
    if (!session) return 'General';
    const title = (session.title || '').toLowerCase();
    if (title.includes('taekwondo')) return 'Taekwondo';
    if (title.includes('karate')) return 'Karate';
    if (title.includes('kickboxing')) return 'Kickboxing';
    if (title.includes('kung fu')) return 'Kung Fu';
    if (title.includes('yoga')) return 'Yoga';
    if (title.includes('zumba') || title.includes('fitness')) return 'Fitness';
    if (title.includes('personal') || title.includes('trainer')) return 'Personal Training';
    if (title.includes('elite') || title.includes('performance')) return 'Elite Performance';
    return 'General';
  };

  const categories = useMemo(() => {
    const list = ['All'];
    allSessions.forEach(session => {
      const cat = getSessionCategory(session);
      if (!list.includes(cat)) {
        list.push(cat);
      }
    });
    return list;
  }, [allSessions]);

  const filteredSessionsByCat = useMemo(() => {
    if (selectedCategory === 'All') return allSessions;
    return allSessions.filter(s => getSessionCategory(s) === selectedCategory);
  }, [allSessions, selectedCategory]);

  const categoryRosterMembers = useMemo(() => {
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

  const handleToggleSessionStatus = async (session) => {
    const newStatus = session.status === 'in-progress' ? 'upcoming' : 'in-progress';
    try {
      localStorage.setItem(`gym_session_status_${session.id}`, newStatus);
    } catch (e) {}

    // 1. Immediately update UI state so button and card status update without delay
    setSessions(prev => {
      const exists = prev.some(s => s.id === session.id);
      if (exists) {
        return prev.map(s => s.id === session.id ? { ...s, status: newStatus } : s);
      } else {
        return [{ ...session, status: newStatus }, ...prev];
      }
    });

    // 2. Notify backend / parent
    try {
      if (onUpdateSessionStatus) {
        await onUpdateSessionStatus(session.id, newStatus);
      } else {
        await apiService.updateSession(session.id, { status: newStatus });
      }
    } catch (err) {
      console.warn('Non-blocking status update error:', err);
    }
  };

  const updateSessionChecklist = async (sessionId, updatedList) => {
    try {
      localStorage.setItem(`gym_session_checklist_${sessionId}`, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('Error saving checklist to localStorage:', e);
    }

    setSessions(prev => {
      const exists = prev.some(s => s.id === sessionId);
      if (exists) {
        return prev.map(s => s.id === sessionId ? { ...s, checklist: updatedList } : s);
      } else {
        const target = allSessions.find(s => s.id === sessionId);
        if (target) {
          return [{ ...target, checklist: updatedList }, ...prev];
        }
        return prev;
      }
    });

    try {
      await apiService.updateSession(sessionId, { checklist: updatedList });
    } catch (err) {
      console.warn('Non-blocking checklist update error:', err);
    }
  };

  const handleToggleChecklist = async (sessionId, itemId, itemIndex) => {
    const targetSession = allSessions.find(s => s.id === sessionId);
    if (!targetSession) return;

    const currentChecklist = targetSession.checklist || [];
    const updatedList = currentChecklist.map((item, idx) => {
      const matches = (itemId !== undefined && itemId !== null && item.id !== undefined && item.id !== null)
        ? item.id === itemId
        : idx === itemIndex;
      return matches ? { ...item, checked: !item.checked } : item;
    });

    await updateSessionChecklist(sessionId, updatedList);
  };

  const handleAddChecklistItem = async (sessionId, text) => {
    if (!text || !text.trim()) return;
    const targetSession = allSessions.find(s => s.id === sessionId);
    if (!targetSession) return;

    const currentChecklist = targetSession.checklist || [];
    const newItem = {
      id: Date.now(),
      text: text.trim(),
      checked: false
    };
    const updatedList = [...currentChecklist, newItem];

    await updateSessionChecklist(sessionId, updatedList);
  };

  const executeDeleteChecklistItem = async (sessionId, itemId, itemIndex) => {
    const targetSession = allSessions.find(s => s.id === sessionId);
    if (!targetSession) return;

    const currentChecklist = targetSession.checklist || [];
    const updatedList = currentChecklist.filter((item, idx) => {
      if (itemId !== undefined && itemId !== null && item.id !== undefined && item.id !== null) {
        return item.id !== itemId;
      }
      return idx !== itemIndex;
    });

    await updateSessionChecklist(sessionId, updatedList);
  };

  const handleDeleteChecklistItem = (sessionId, itemId, itemIndex) => {
    setTaskToDelete({ sessionId, itemId, itemIndex });
  };

  const handleCheckIn = async (memberId) => {
    if (inClubList.includes(memberId)) {
      const member = members.find(m => m.id === memberId);
      setShowCheckInSuccess(`${member?.name || 'Member'} is already checked in.`);
      setTimeout(() => setShowCheckInSuccess(null), 3000);
      return;
    }
    
    try {
      await apiService.checkInMember(memberId);
      setInClubList(prev => [...prev, memberId]);
      const member = members.find(m => m.id === memberId);
      setShowCheckInSuccess(`Successfully checked in ${member?.name || 'Member'}!`);
      setSearchTerm('');
      setTimeout(() => setShowCheckInSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Check-in failed: ' + err.message);
    }
  };

  const handleCheckOut = async (memberId) => {
    try {
      await apiService.checkOutMember(memberId);
      setInClubList(prev => prev.filter(id => id !== memberId));
      const member = members.find(m => m.id === memberId);
      setShowCheckInSuccess(`${member?.name || 'Member'} has been checked out.`);
      setTimeout(() => setShowCheckInSuccess(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Check-out failed: ' + err.message);
    }
  };

  const filteredMembers = searchTerm.trim() === '' 
    ? [] 
    : members.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));

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

      {/* In-app Confirmation Modal for Task Deletion */}
      {taskToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card p-6 border border-[var(--glass-border)] max-w-sm w-full shadow-2xl rounded-2xl bg-[var(--bg-secondary)] space-y-4">
            <h4 className="text-sm uppercase tracking-luxury font-bold text-[var(--text-primary)]">Delete Protocol Task</h4>
            <p className="text-xs text-[var(--text-secondary)]">
              Are you sure you want to delete this task from the checklist?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-luxury border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  executeDeleteChecklistItem(taskToDelete.sessionId, taskToDelete.itemId, taskToDelete.itemIndex);
                  setTaskToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs uppercase tracking-luxury font-bold bg-rose-500 text-white hover:bg-rose-600 transition-colors shadow-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Key Performance Stats */}
      <DashboardMetrics 
        dashboardStats={dashboardStats}
        members={members}
        inClubList={inClubList}
        allSessions={allSessions}
        activeSessionsCount={activeSessionsCount}
        upcomingSessionsCount={upcomingSessionsCount}
        onTabChange={onTabChange}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <LiveSessionsCard 
          allSessions={allSessions}
          onTabChange={onTabChange}
          handleToggleSessionStatus={handleToggleSessionStatus}
          handleToggleChecklist={handleToggleChecklist}
          handleDeleteChecklistItem={handleDeleteChecklistItem}
          handleAddChecklistItem={handleAddChecklistItem}
        />

        <div className="space-y-8">
          <DeskCheckInCard 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            filteredMembers={filteredMembers}
            categoryRosterMembers={categoryRosterMembers}
            inClubList={inClubList}
            members={members}
            handleCheckIn={handleCheckIn}
            handleCheckOut={handleCheckOut}
          />

          <RecentActivityLog 
            recentActivities={recentActivities}
            loadingStats={loadingStats}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
