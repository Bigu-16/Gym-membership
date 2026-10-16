import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService, avatarFor } from '../services/api';
import { daysUntil, EXPIRING_SOON_DAYS } from '../utils/membership';

const SESSION_HISTORY_DAYS = 120;
// Desk computers are shared: sign out after this long without any activity.
export const IDLE_LOGOUT_MINUTES = 60;

const isoDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const familyGroupFrom = (familyId, trainees, family) => {
  const parentName = family?.parentName || trainees.find((t) => t.parentName)?.parentName || null;
  const firstName = (parentName || trainees[0]?.name || 'Family').split(' ')[0];
  const expiries = trainees.map((t) => t.expiryDate).filter(Boolean).sort();
  return {
    isGroup: true,
    id: `family-${familyId}`,
    familyId,
    parentName,
    parentPhone: family?.parentPhone || trainees[0]?.parentPhone || null,
    parentEmail: family?.parentEmail || null,
    trainees,
    name: `${firstName}'s Family`,
    plan: `Family (${trainees.length} ${trainees.length === 1 ? 'trainee' : 'trainees'})`,
    image: avatarFor(firstName),
    // The family needs attention as soon as any child's membership runs out.
    expiryDate: expiries[0] || null,
    isFrozen: trainees.length > 0 && trainees.every((t) => t.isFrozen)
  };
};

export const useGymData = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    typeof window !== 'undefined' && !!sessionStorage.getItem('gym_api_token')
  );
  const [currentUser, setCurrentUser] = useState(null);
  const [members, setMembers] = useState([]);
  const [families, setFamilies] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [inClubList, setInClubList] = useState([]);
  const [scheduleTemplates, setScheduleTemplates] = useState([]);
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState('');
  const [notificationJobs, setNotificationJobs] = useState([]);
  const [selectedMemberKey, setSelectedMemberKey] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [signOutNotice, setSignOutNotice] = useState('');

  const handleLogout = useCallback((notice = '') => {
    apiService.logout();
    setSignOutNotice(typeof notice === 'string' ? notice : '');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setMembers([]);
    setFamilies([]);
    setSessions([]);
    setInClubList([]);
    setScheduleTemplates([]);
    setMembershipPlans([]);
    setEnrollments([]);
    setNotificationJobs([]);
    setSelectedMemberKey(null);
    setHasLoaded(false);
  }, []);

  const handleApiError = useCallback((err, fallback) => {
    console.error(err);
    if (err?.message === 'Unauthenticated') {
      handleLogout('Your session ended. Please sign in again.');
      return;
    }
    setError(fallback);
  }, [handleLogout]);

  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError('');
    try {
      const userProfile = await apiService.getMe();
      setCurrentUser(userProfile);

      const [templatesData, membersData, familiesData, enrollmentsData, plansData, activeCheckIns, jobsData] =
        await Promise.all([
          apiService.getTemplates(),
          apiService.getMembers(),
          apiService.getFamilies(),
          apiService.getEnrollments(),
          apiService.getPlans(),
          apiService.getActiveCheckIns(),
          apiService.getNotificationJobs().catch(() => [])
        ]);
      const sessionsData = await apiService.getSessions(templatesData, { date_from: isoDaysAgo(SESSION_HISTORY_DAYS) });

      setMembershipPlans(plansData);
      setEnrollments(enrollmentsData);
      setFamilies(familiesData);
      setScheduleTemplates(templatesData);
      setMembers(membersData);
      setSessions(sessionsData);
      setInClubList(activeCheckIns.map((c) => c.member_id));
      setNotificationJobs(jobsData);
      setHasLoaded(true);
    } catch (err) {
      handleApiError(err, 'Could not reach the N & T server. Check your connection and press Retry.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, handleApiError]);

  // Automatic sign-out after inactivity on shared front-desk computers.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let timer;
    const restart = () => {
      clearTimeout(timer);
      timer = setTimeout(
        () => handleLogout(`Signed out after ${IDLE_LOGOUT_MINUTES} minutes without activity.`),
        IDLE_LOGOUT_MINUTES * 60000
      );
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((name) => window.addEventListener(name, restart, { passive: true }));
    restart();
    return () => {
      clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, restart));
    };
  }, [isAuthenticated, handleLogout]);

  useEffect(() => {
    if (isAuthenticated) {
      // Authentication state triggers the initial backend synchronization.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // ----- Derived data -------------------------------------------------------
  const plansById = useMemo(() => new Map(membershipPlans.map((p) => [p.id, p])), [membershipPlans]);

  const templatesWithEnrollment = useMemo(() => {
    const counts = new Map();
    enrollments.forEach((e) => {
      if (e.template_id) counts.set(e.template_id, (counts.get(e.template_id) || 0) + 1);
    });
    return scheduleTemplates.map((t) => ({ ...t, enrolled: counts.get(t.id) || 0 }));
  }, [scheduleTemplates, enrollments]);

  const enrichedMembers = useMemo(() => {
    const familyById = new Map(families.map((f) => [f.id, f]));
    const templateById = new Map(templatesWithEnrollment.map((t) => [t.id, t]));
    return members.map((m) => {
      const plan = m.planId ? plansById.get(m.planId) : null;
      const family = m.familyId ? familyById.get(m.familyId) : null;
      const memberEnrollments = enrollments.filter((e) => e.member_id === m.id && e.template_id);
      const enrolledClasses = memberEnrollments
        .map((e) => templateById.get(e.template_id))
        .filter(Boolean)
        .map((t) => ({
          id: t.id,
          className: t.className,
          days: t.days,
          time: t.time,
          slot: `${t.className}: ${t.days} @ ${t.time}`
        }));
      return {
        ...m,
        plan: plan?.name || (m.planId ? 'Unknown package' : 'No package'),
        planDetails: plan || null,
        parentName: m.parentName || family?.parentName || null,
        enrollmentIds: memberEnrollments.map((e) => e.id),
        enrolledTemplateIds: enrolledClasses.map((c) => c.id),
        enrolledClasses,
        enrolledClass: enrolledClasses[0] || null
      };
    });
  }, [members, families, enrollments, plansById, templatesWithEnrollment]);

  const memberGroups = useMemo(() => {
    const familyById = new Map(families.map((f) => [f.id, f]));
    const groups = new Map();
    const result = [];
    enrichedMembers.forEach((m) => {
      if (m.familyId) {
        if (!groups.has(m.familyId)) groups.set(m.familyId, []);
        groups.get(m.familyId).push(m);
      } else {
        result.push(m);
      }
    });
    groups.forEach((trainees, familyId) => result.push(familyGroupFrom(familyId, trainees, familyById.get(familyId))));
    return result;
  }, [enrichedMembers, families]);

  const processedMembers = useMemo(() => {
    let filtered = memberGroups;
    if (filterType === 'expiring') {
      const attention = (item) => {
        const days = daysUntil(item.expiryDate);
        return days !== null && days <= EXPIRING_SOON_DAYS;
      };
      filtered = filtered.filter((item) => (item.isGroup ? item.trainees.some(attention) : attention(item)));
    }
    if (!searchQuery) return filtered;
    const q = searchQuery.toLowerCase();
    const matches = (m) =>
      m.name.toLowerCase().includes(q) ||
      (m.phone || '').toLowerCase().includes(q) ||
      (m.emiratesId || '').toLowerCase().includes(q);
    return filtered.filter((item) =>
      item.isGroup
        ? item.name.toLowerCase().includes(q) ||
          (item.parentName || '').toLowerCase().includes(q) ||
          (item.parentPhone || '').includes(q) ||
          item.trainees.some(matches)
        : matches(item)
    );
  }, [memberGroups, filterType, searchQuery]);

  // The selected member/family is always derived from fresh data, never a stale copy.
  const selectedMember = useMemo(() => {
    if (!selectedMemberKey) return null;
    return memberGroups.find((item) => item.id === selectedMemberKey)
      || enrichedMembers.find((m) => m.id === selectedMemberKey)
      || null;
  }, [selectedMemberKey, memberGroups, enrichedMembers]);

  const setSelectedMember = useCallback((item) => {
    setSelectedMemberKey(item ? item.id : null);
  }, []);

  // ----- Members ------------------------------------------------------------
  /**
   * registration = { parent: {name, phone, email} | null,
   *                  trainees: [{ ...member fields, payment, templateIds: [], termsAccepted }] }
   * Returns { members, warnings }. Throws if the members could not be created.
   */
  const handleEnroll = async ({ parent = null, trainees = [] }) => {
    const created = await apiService.enrollMembers(trainees, parent);
    const warnings = [];

    // The API returns members in the order they were sent.
    for (let i = 0; i < trainees.length; i += 1) {
      const member = created[i];
      if (!member) continue;
      for (const templateId of trainees[i].templateIds || []) {
        try {
          await apiService.enrollMemberInClass(member.id, templateId);
        } catch (err) {
          const template = scheduleTemplates.find((t) => t.id === templateId);
          warnings.push(`${member.name} was registered but not added to ${template?.className || 'the class'}: ${err.message}`);
        }
      }
    }

    await loadData();
    return { members: created, warnings };
  };

  const handleUpdateMember = async (updatedMember) => {
    if (updatedMember.isGroup) {
      await apiService.freezeFamily(String(updatedMember.familyId), updatedMember.isFrozen);
    } else {
      const original = members.find((m) => m.id === updatedMember.id);
      await apiService.updateMember(updatedMember.id, updatedMember);
      if (original && original.isFrozen !== updatedMember.isFrozen) {
        await apiService.freezeMember(updatedMember.id, updatedMember.isFrozen);
      }
    }
    await loadData();
  };

  /** renewal = { planId, startFrom: 'expiry'|'today', payment: {amount, method} } per trainee. */
  const handleRenewMember = async (target, renewal) => {
    const people = target.isGroup ? target.trainees : [target];
    for (const person of people) {
      const perPerson = typeof renewal === 'function' ? renewal(person) : renewal;
      await apiService.renewMember(person.id, perPerson);
    }
    await loadData();
  };

  const handleDeleteMember = async (memberId) => {
    await apiService.deleteMember(memberId);
    setSelectedMemberKey(null);
    await loadData();
  };

  const handleSetMemberClasses = async (member, templateIds) => {
    const wanted = new Set(templateIds);
    const current = enrollments.filter((e) => e.member_id === member.id && e.template_id);
    for (const enrollment of current) {
      if (!wanted.has(enrollment.template_id)) await apiService.removeEnrollment(enrollment.id);
    }
    const existing = new Set(current.map((e) => e.template_id));
    for (const templateId of templateIds) {
      if (!existing.has(templateId)) await apiService.enrollMemberInClass(member.id, templateId);
    }
    await loadData();
  };

  // ----- Timetable & packages -------------------------------------------------
  const handleAddTemplate = async (newTemplate) => {
    const created = await apiService.createTemplate(newTemplate);
    setScheduleTemplates((current) => [...current, created]);
    return created;
  };

  const handleDeleteTemplate = async (id) => {
    await apiService.deleteTemplate(id);
    setScheduleTemplates((current) => current.filter((template) => template.id !== id));
    setEnrollments((current) => current.filter((e) => e.template_id !== id));
  };

  const handleUpdateTemplate = async (updatedTemplate) => {
    const updated = await apiService.updateTemplate(updatedTemplate.id, updatedTemplate);
    setScheduleTemplates((current) => current.map((template) => (template.id === updated.id ? updated : template)));
    return updated;
  };

  const handleLoadOfficialTimetable = async () => {
    const result = await apiService.loadOfficialTimetable();
    await loadData();
    return result;
  };

  const handleAddPlan = async (plan) => {
    const created = await apiService.createPlan(plan);
    setMembershipPlans((current) => [...current, created]);
    return created;
  };

  const handleUpdatePlan = async (plan) => {
    const payload = { ...plan };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    const updated = await apiService.updatePlan(plan.id, payload);
    setMembershipPlans((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    return updated;
  };

  const handleDeletePlan = async (id) => {
    await apiService.deletePlan(id);
    setMembershipPlans((current) => current.filter((plan) => plan.id !== id));
  };

  const handleLoadOfficialPackages = async () => {
    const result = await apiService.loadOfficialPackages();
    setMembershipPlans(await apiService.getPlans());
    return result;
  };

  // ----- Sessions -------------------------------------------------------------
  /** Persist status/checklist changes; projected classes become recorded sessions. */
  const saveSession = useCallback(async (session, changes) => {
    const saved = await apiService.saveSession(session, changes, scheduleTemplates);
    setSessions((current) => {
      const withoutOld = current.filter((s) => s.id !== saved.id);
      return [saved, ...withoutOld];
    });
    return saved;
  }, [scheduleTemplates]);

  const checkIn = async (memberId, options) => {
    await apiService.checkInMember(memberId, options);
    setInClubList((prev) => (prev.includes(memberId) ? prev : [...prev, memberId]));
  };

  const checkOut = async (memberId) => {
    await apiService.checkOutMember(memberId);
    setInClubList((prev) => prev.filter((id) => id !== memberId));
  };

  const refreshNotificationJobs = async () => {
    setNotificationJobs(await apiService.getNotificationJobs());
  };

  return {
    isAuthenticated,
    setIsAuthenticated,
    signOutNotice,
    currentUser,
    members: enrichedMembers,
    families,
    sessions,
    inClubList,
    scheduleTemplates: templatesWithEnrollment,
    membershipPlans,
    enrollments,
    loading,
    hasLoaded,
    error,
    notificationJobs,
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
    handleLoadOfficialTimetable,
    handleAddPlan,
    handleUpdatePlan,
    handleDeletePlan,
    handleLoadOfficialPackages,
    saveSession,
    checkIn,
    checkOut,
    refreshNotificationJobs,
    handleUpdateMember,
    handleRenewMember,
    handleDeleteMember,
    handleSetMemberClasses,
    processedMembers
  };
};
