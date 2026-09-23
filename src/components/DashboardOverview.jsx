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

      return {
        id: `template-${template.id}`,
        title: template.className || 'Group Class',
        trainer: trainer,
        location: templateTitle.includes("yoga") ? 'Zen Garden' : 'Studio B - Group Floor',
        start: start,
        end: end,
        status: start < new Date() && end > new Date() ? 'in-progress' : 'upcoming',
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

  const materializeSession = async (sessionId) => {
    if (String(sessionId).startsWith('template-')) {
      const tempId = parseInt(String(sessionId).split('-')[1], 10);
      const template = scheduleTemplates.find(t => t.id === tempId);
      
      const newDbSession = await apiService.createSession({
        templateId: tempId,
        start: new Date(),
        trainer: template?.trainer || 'Master Kim',
        status: 'in-progress',
        checklist: [
          { id: 1, text: 'Safety warm-up completed', checked: false },
          { id: 2, text: 'Core group training sequence', checked: false },
          { id: 3, text: 'Assisted stretching session', checked: false }
        ]
      });

      const mapped = {
        id: newDbSession.id,
        title: template.className,
        trainer: newDbSession.trainer_name,
        location: template.className.toLowerCase().includes('yoga') ? 'Zen Garden' : 'Studio B - Group Floor',
        start: new Date(),
        end: new Date(Date.now() + 60 * 60 * 1000),
        status: 'in-progress',
        type: 'group',
        checklist: newDbSession.checklist_data?.items || [],
        templateId: tempId
      };

      setSessions(prev => [mapped, ...prev]);
      return mapped;
    }
    return allSessions.find(s => s.id === sessionId);
  };

  const handleToggleSessionStatus = async (session) => {
    try {
      if (String(session.id).startsWith('template-')) {
        await materializeSession(session.id);
      } else {
        const newStatus = session.status === 'in-progress' ? 'upcoming' : 'in-progress';
        if (onUpdateSessionStatus) {
          await onUpdateSessionStatus(session.id, newStatus);
        }
      }
    } catch (err) {
      console.error('Failed to toggle session status:', err);
    }
  };

  const handleToggleChecklist = async (sessionId, itemId, itemIndex) => {
    try {
      const targetSession = await materializeSession(sessionId);
      if (!targetSession) return;

      const updatedList = targetSession.checklist.map((item, idx) => {
        const matches = (itemId !== undefined && itemId !== null && item.id !== undefined && item.id !== null)
          ? item.id === itemId
          : idx === itemIndex;
        return matches ? { ...item, checked: !item.checked } : item;
      });

      setSessions(prev => prev.map(s => s.id === targetSession.id ? { ...s, checklist: updatedList } : s));
      await apiService.updateSession(targetSession.id, { checklist: updatedList });
    } catch (err) {
      console.error(err);
      alert('Failed to toggle checklist task: ' + err.message);
    }
  };

  const handleAddChecklistItem = async (sessionId, text) => {
    if (!text.trim()) return;
    try {
      const targetSession = await materializeSession(sessionId);
      if (!targetSession) return;

      const newItem = {
        id: Date.now(),
        text: text.trim(),
        checked: false
      };
      const updatedList = [...targetSession.checklist, newItem];

      setSessions(prev => prev.map(s => s.id === targetSession.id ? { ...s, checklist: updatedList } : s));
      await apiService.updateSession(targetSession.id, { checklist: updatedList });
    } catch (err) {
      console.error(err);
      alert('Failed to add checklist task: ' + err.message);
    }
  };

  const handleDeleteChecklistItem = async (sessionId, itemId, itemIndex) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this task from the checklist?");
    if (!isConfirmed) return;

    try {
      const targetSession = await materializeSession(sessionId);
      if (!targetSession) return;

      const updatedList = targetSession.checklist.filter((item, idx) => {
        if (itemId !== undefined && itemId !== null && item.id !== undefined && item.id !== null) {
          return item.id !== itemId;
        }
        return idx !== itemIndex;
      });

      setSessions(prev => prev.map(s => s.id === targetSession.id ? { ...s, checklist: updatedList } : s));
      await apiService.updateSession(targetSession.id, { checklist: updatedList });
    } catch (err) {
      console.error(err);
      alert('Failed to delete checklist task: ' + err.message);
    }
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
