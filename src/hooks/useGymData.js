import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

export const useGymData = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('gym_api_token'));
  const [currentUser, setCurrentUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [inClubList, setInClubList] = useState([]);
  const [scheduleTemplates, setScheduleTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notificationJobs, setNotificationJobs] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const handleLogout = useCallback(() => {
    apiService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setMembers([]);
    setSessions([]);
    setInClubList([]);
    setScheduleTemplates([]);
    setNotificationJobs([]);
    setSelectedMember(null);
  }, []);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const userProfile = await apiService.getMe();
      setCurrentUser(userProfile);

      const [templatesData, membersData, familiesData, enrollmentsData] = await Promise.all([
        apiService.getTemplates(),
        apiService.getMembers(),
        apiService.getFamilies().catch(() => []),
        apiService.getEnrollments().catch(() => [])
      ]);

      const familyParentMap = new Map();
      familiesData.forEach(f => {
        if (f.parentPhone && f.parentName) {
          familyParentMap.set(f.parentPhone, f.parentName);
        }
      });

      const enrichedMembers = membersData.map(m => {
        const parentName = m.parentName || (m.parentPhone ? familyParentMap.get(m.parentPhone) : null);
        const userEnrollment = enrollmentsData.find(e => e.member_id === m.id);
        const enrolledTemplate = userEnrollment ? templatesData.find(t => t.id === userEnrollment.template_id) : null;
        const fallbackTemplate = !enrolledTemplate && m.plan 
          ? templatesData.find(t => t.className && (m.plan.toLowerCase().includes(t.className.toLowerCase()) || t.className.toLowerCase().includes(m.plan.toLowerCase()))) 
          : null;
        const resolvedTemplate = enrolledTemplate || fallbackTemplate;

        const enrolledClass = resolvedTemplate ? {
          id: resolvedTemplate.id,
          className: resolvedTemplate.className || resolvedTemplate.title,
          days: Array.isArray(resolvedTemplate.days) ? resolvedTemplate.days.join(', ') : resolvedTemplate.days,
          time: resolvedTemplate.time,
          location: resolvedTemplate.location || 'Main Studio',
          slot: `${resolvedTemplate.className || resolvedTemplate.title}: ${Array.isArray(resolvedTemplate.days) ? resolvedTemplate.days.join(', ') : resolvedTemplate.days} @ ${resolvedTemplate.time}`
        } : (m.schedule?.slot ? {
          className: m.plan || 'General Class',
          slot: m.schedule.slot,
          days: m.schedule.slot.includes(' @ ') ? m.schedule.slot.split(' @ ')[0] : 'Scheduled',
          time: m.schedule.slot.includes(' @ ') ? m.schedule.slot.split(' @ ')[1] : '',
          location: m.schedule.location || 'Main Studio'
        } : null);

        return {
          ...m,
          ...(parentName ? { parentName } : {}),
          ...(enrolledClass ? { enrolledClass } : {})
        };
      });

      setMembers(enrichedMembers);
      setSelectedMember(prev => {
        if (!prev) return null;
        if (prev.isGroup) {
          const familyMembers = enrichedMembers.filter(m => m.parentPhone === prev.parentPhone);
          if (familyMembers.length === 0) return null;
          
          const matchedFamily = familiesData.find(f => f.parentPhone === prev.parentPhone);
          const parentName = matchedFamily?.parentName || familyMembers.find(m => m.parentName)?.parentName || (prev.parentName !== prev.parentPhone ? prev.parentName : null);
          const displayName = parentName || familyMembers[0].name.split(' ')[0];
          const firstName = displayName.split(' ')[0];
          const isFrozen = familyMembers.some(m => m.isFrozen);
          const expiryDate = familyMembers[0].expiryDate;
          
          return {
            isGroup: true,
            id: prev.parentPhone,
            parentName: parentName || prev.parentPhone,
            parentPhone: prev.parentPhone,
            trainees: familyMembers,
            name: `${firstName}'s Family`,
            plan: `Family Group (${familyMembers.length} Kids)`,
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=random&color=fff`,
            expiryDate: expiryDate,
            isFrozen: isFrozen
          };
        } else {
          const fresh = enrichedMembers.find(m => m.id === prev.id);
          return fresh || null;
        }
      });

      const templatesWithEnrolled = templatesData.map(t => ({
        ...t,
        enrolled: enrollmentsData.filter(e => e.template_id === t.id).length
      }));
      setScheduleTemplates(templatesWithEnrolled);

      const activeCheckIns = await apiService.getActiveCheckIns();
      setInClubList(activeCheckIns.map(c => c.member_id));

      const sessionsData = await apiService.getSessions(templatesData);
      setSessions(sessionsData);

      const jobsData = await apiService.getNotificationJobs();
      setNotificationJobs(jobsData);
    } catch (err) {
      console.error(err);
      if (err.message === 'Unauthenticated' || err.message.includes('401')) {
        handleLogout();
      } else {
        setError('Error syncing with Azyab Backend. Make sure the backend server is running.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, handleLogout]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  const handleEnroll = async (newMembers, newSessions) => {
    try {
      const enrolled = await apiService.enrollMembers(newMembers);
      
      for (let i = 0; i < newMembers.length; i++) {
        const mem = newMembers[i];
        if (mem.trainingType === 'group' && mem.schedule?.slot) {
          const template = scheduleTemplates.find(t => {
            const daysStr = Array.isArray(t.days) ? t.days.join(', ') : (t.days || '');
            const slotText = `${t.className || 'General Class'}: ${daysStr} @ ${t.time}`;
            if (slotText === mem.schedule.slot) return true;
            if (mem.schedule?.slot) {
              const nameMatch = t.className && mem.schedule.slot.toLowerCase().includes(t.className.toLowerCase());
              const timeMatch = t.time && mem.schedule.slot.includes(t.time);
              if (nameMatch && timeMatch) return true;
              if (nameMatch) return true;
            }
            return false;
          });
          if (template) {
            const backendMember = enrolled.find(em => em.phone === mem.phone);
            if (backendMember) {
              await apiService.enrollMemberInClass(backendMember.id, template.id);
            }
          }
        }
      }

      for (const sess of newSessions) {
        try {
          await apiService.createSession({
            start: sess.start,
            trainer: sess.trainer || 'Coach',
            status: sess.status || 'upcoming',
            checklist: sess.checklist || []
          });
        } catch (e) {
          console.warn('Session creation note:', e);
        }
      }

      await loadData();
    } catch (err) {
      console.error(err);
      alert('Enrollment failed: ' + err.message);
    }
  };

  const handleAddTemplate = async (newTemplate) => {
    try {
      await apiService.createTemplate(newTemplate);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to create class template: ' + err.message);
    }
  };

  const handleDeleteTemplate = async (id) => {
    try {
      await apiService.deleteTemplate(id);
      setScheduleTemplates(prev => prev.filter(t => t.id !== id));
      await loadData();
    } catch (err) {
      console.error('Failed to delete template from backend:', err);
      setScheduleTemplates(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleUpdateTemplate = async (updatedTemplate) => {
    try {
      await apiService.updateTemplate(updatedTemplate.id, updatedTemplate);
      setScheduleTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
      await loadData();
    } catch (err) {
      console.error('Failed to update template on backend:', err);
      setScheduleTemplates(prev => prev.map(t => t.id === updatedTemplate.id ? updatedTemplate : t));
    }
  };

  const handleUpdateSessionStatus = async (sessionId, newStatus) => {
    try {
      await apiService.updateSessionStatus(sessionId, newStatus);
      setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, status: newStatus } : s));
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update session status: ' + err.message);
    }
  };

  const handleUpdateMember = async (updatedMember) => {
    try {
      if (updatedMember.isGroup) {
        const enrolled = await apiService.freezeFamily(updatedMember.parentPhone, updatedMember.isFrozen);
        setMembers(prev => prev.map(m => {
          if (m.parentPhone === updatedMember.parentPhone) {
            const updatedTrainee = enrolled.find(t => t.id === m.id);
            return updatedTrainee || m;
          }
          return m;
        }));
        setSelectedMember(updatedMember);
      } else {
        const saved = await apiService.updateMember(updatedMember.id, updatedMember);
        await apiService.freezeMember(updatedMember.id, updatedMember.isFrozen);
        setMembers(prev => prev.map(m => m.id === updatedMember.id ? saved : m));
        
        if (updatedMember.parentPhone) {
          setSelectedMember(prev => {
            if (prev && prev.isGroup && prev.parentPhone === updatedMember.parentPhone) {
              return prev;
            }
            return saved;
          });
        } else {
          setSelectedMember(saved);
        }
      }
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to update member: ' + err.message);
    }
  };

  const handleRenewMember = async (target, newExpiryDate, planId = null) => {
    try {
      if (target.isGroup && target.trainees) {
        await Promise.all(
          target.trainees.map(t =>
            apiService.updateMember(t.id, {
              ...t,
              expiryDate: newExpiryDate,
              ...(planId ? { planId } : {})
            })
          )
        );
      } else {
        await apiService.updateMember(target.id, {
          ...target,
          expiryDate: newExpiryDate,
          ...(planId ? { planId } : {})
        });
      }
      await loadData();
    } catch (err) {
      console.error('Renewal error:', err);
      alert('Failed to renew membership: ' + (err.message || 'Unknown error'));
      throw err;
    }
  };

  const handleDeleteMember = async (memberId) => {
    try {
      await apiService.deleteMember(memberId);
      setMembers(prev => prev.filter(m => m.id !== memberId));
      setSelectedMember(null);
      await loadData();
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const calculateDaysRemaining = (date) => {
    if (!date) return 9999;
    const today = new Date();
    const expiry = new Date(date);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getProcessedMembers = () => {
    const groups = new Map();
    const result = [];

    members.forEach(m => {
      if (m.parentPhone) {
        if (!groups.has(m.parentPhone)) {
          const parentName = m.parentName || m.parentPhone;
          const firstName = (m.parentName && m.parentName !== m.parentPhone)
            ? m.parentName.split(' ')[0]
            : m.name.split(' ')[0];
          groups.set(m.parentPhone, {
            isGroup: true,
            id: m.parentPhone,
            parentName: parentName,
            parentPhone: m.parentPhone,
            trainees: [m],
            name: `${firstName}'s Family`,
            plan: 'Family Group',
            image: `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=random&color=fff`,
            expiryDate: m.expiryDate,
            isFrozen: m.isFrozen
          });
        } else {
          const group = groups.get(m.parentPhone);
          group.trainees.push(m);
          if (m.parentName && (!group.parentName || group.parentName === group.parentPhone)) {
            group.parentName = m.parentName;
            const firstName = m.parentName.split(' ')[0];
            group.name = `${firstName}'s Family`;
            group.image = `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName)}&background=random&color=fff`;
          }
          if (m.isFrozen) group.isFrozen = true;
        }
      } else {
        result.push(m);
      }
    });

    groups.forEach(g => {
      g.plan = `Family Group (${g.trainees.length} Kids)`;
      result.push(g);
    });

    let filtered = result;

    if (filterType === 'expiring') {
      filtered = filtered.filter(item => {
        if (item.isGroup) {
          return item.trainees.some(t => {
            const days = calculateDaysRemaining(t.expiryDate);
            return days >= 0 && days < 7;
          });
        } else {
          const days = calculateDaysRemaining(item.expiryDate);
          return days >= 0 && days < 7;
        }
      });
    }

    if (!searchQuery) return filtered;
    
    const lowerQ = searchQuery.toLowerCase();
    return filtered.filter(item => {
      if (item.isGroup) {
        if (item.name.toLowerCase().includes(lowerQ) || item.parentPhone.includes(lowerQ)) return true;
        return item.trainees.some(t => t.name.toLowerCase().includes(lowerQ) || (t.phone && t.phone.toLowerCase().includes(lowerQ)));
      } else {
        return item.name.toLowerCase().includes(lowerQ) || (item.phone && item.phone.toLowerCase().includes(lowerQ));
      }
    });
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    currentUser,
    members,
    setMembers,
    sessions,
    setSessions,
    inClubList,
    setInClubList,
    scheduleTemplates,
    loading,
    error,
    notificationJobs,
    setNotificationJobs,
    selectedMember,
    setSelectedMember,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    loadData,
    handleLogout,
    handleEnroll,
    handleAddTemplate,
    handleDeleteTemplate,
    handleUpdateTemplate,
    handleUpdateSessionStatus,
    handleUpdateMember,
    handleRenewMember,
    handleDeleteMember,
    processedMembers: getProcessedMembers()
  };
};
