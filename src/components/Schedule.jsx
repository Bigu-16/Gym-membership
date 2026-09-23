import React, { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  addMonths, 
  subMonths,
  addWeeks, 
  subWeeks,
  isSameDay, 
  startOfDay,
  differenceInMinutes
} from 'date-fns';
import { apiService } from '../services/api';
import ScheduleHeader from './schedule/ScheduleHeader';
import DayView from './schedule/DayView';
import WeekView from './schedule/WeekView';
import MonthView from './schedule/MonthView';
import TemplatesView from './schedule/TemplatesView';
import SessionModal from './schedule/SessionModal';
import TemplateModal from './schedule/TemplateModal';
import DeleteTemplateModal from './schedule/DeleteTemplateModal';

const Schedule = ({ 
  sessions = [], 
  scheduleTemplates = [], 
  members = [], 
  onAddTemplate, 
  onDeleteTemplate,
  onUpdateTemplate,
  onUpdateSessionStatus
}) => {
  const [view, setView] = useState('week'); // 'day', 'week', 'month', 'templates'
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState('All');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState(null);
  const [localChecklists, setLocalChecklists] = useState({});

  useEffect(() => {
    if (sessions && sessions.length > 0) {
      setLocalChecklists(prev => {
        const updated = { ...prev };
        sessions.forEach(s => {
          if (s.checklist) {
            updated[s.id] = s.checklist;
          }
        });
        return updated;
      });
    }
  }, [sessions]);

  const handleToggleChecklist = (sessionId, itemId, itemIndex) => {
    setLocalChecklists(prev => {
      const currentList = prev[sessionId] || (sessions.find(s => s.id === sessionId)?.checklist || []);
      const updatedList = currentList.map((item, idx) => {
        const matches = (itemId !== undefined && itemId !== null && item.id !== undefined && item.id !== null)
          ? item.id === itemId
          : idx === itemIndex;
        return matches ? { ...item, checked: !item.checked } : item;
      });
      
      apiService.updateSession(sessionId, { checklist: updatedList }).catch(console.error);
      
      return {
        ...prev,
        [sessionId]: updatedList
      };
    });
  };

  const handleAddChecklistItem = (sessionId, text) => {
    if (!text.trim()) return;
    setLocalChecklists(prev => {
      const currentList = prev[sessionId] || (sessions.find(s => s.id === sessionId)?.checklist || []);
      const newItem = {
        id: Date.now(),
        text: text.trim(),
        checked: false
      };
      const updatedList = [...currentList, newItem];
      
      apiService.updateSession(sessionId, { checklist: updatedList }).catch(console.error);
      
      return {
        ...prev,
        [sessionId]: updatedList
      };
    });
  };

  const handleDeleteChecklistItem = (sessionId, itemId, itemIndex) => {
    const isConfirmed = window.confirm("Are you sure you want to delete this task from the checklist?");
    if (!isConfirmed) return;

    setLocalChecklists(prev => {
      const currentList = prev[sessionId] || (sessions.find(s => s.id === sessionId)?.checklist || []);
      const updatedList = currentList.filter((item, idx) => {
        if (itemId !== undefined && itemId !== null && item.id !== undefined && item.id !== null) {
          return item.id !== itemId;
        }
        return idx !== itemIndex;
      });
      
      apiService.updateSession(sessionId, { checklist: updatedList }).catch(console.error);
      
      return {
        ...prev,
        [sessionId]: updatedList
      };
    });
  };

  const [timeLeft, setTimeLeft] = useState('');

  // Create/Edit Template modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedClassOption, setSelectedClassOption] = useState('Kids Taekwondo');
  const [selectedDays, setSelectedDays] = useState([]);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:00');
  const [capacity, setCapacity] = useState(15);
  const [deleteTemplateId, setDeleteTemplateId] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingTemplate(null);
    setSelectedClassOption('Kids Taekwondo');
    setSelectedDays([]);
    setStartTime('16:00');
    setEndTime('17:00');
    setCapacity(15);
  };

  const handleEditClick = (template) => {
    setEditingTemplate(template);
    setSelectedClassOption(template.className || 'Kids Taekwondo');
    
    const dayMap = {
      'Mon': 'Monday',
      'Tue': 'Tuesday',
      'Wed': 'Wednesday',
      'Thu': 'Thursday',
      'Fri': 'Friday',
      'Sat': 'Saturday',
      'Sun': 'Sunday'
    };
    if (template.days) {
      const shortDays = template.days.split(', ').map(d => d.trim());
      setSelectedDays(shortDays.map(sd => dayMap[sd]).filter(Boolean));
    } else {
      setSelectedDays([]);
    }
    
    const parseTime12hTo24h = (t12) => {
      const parts12 = t12.trim().split(/\s+/);
      const timeStrPart = parts12[0];
      const modifier = parts12[1] ? parts12[1].toUpperCase() : null;
      let [hours, minutes] = timeStrPart.split(':');
      if (modifier === 'PM' && hours !== '12') hours = String(parseInt(hours, 10) + 12);
      if (modifier === 'AM' && hours === '12') hours = '00';
      return `${hours.padStart(2, '0')}:${(minutes || '00').padStart(2, '0')}`;
    };
    
    try {
      if (template.time && template.time.includes(' - ')) {
        const [startStr, endStr] = template.time.split(' - ');
        setStartTime(parseTime12hTo24h(startStr));
        setEndTime(parseTime12hTo24h(endStr));
      } else if (template.time) {
        setStartTime(parseTime12hTo24h(template.time));
        const [sh, sm] = parseTime12hTo24h(template.time).split(':').map(Number);
        const eh = (sh + 1) % 24;
        setEndTime(`${String(eh).padStart(2, '0')}:${String(sm || 0).padStart(2, '0')}`);
      } else {
        setStartTime('16:00');
        setEndTime('17:00');
      }
    } catch (e) {
      setStartTime('16:00');
      setEndTime('17:00');
    }
    
    setCapacity(template.capacity || 15);
    setIsCreateModalOpen(true);
  };

  const existingClassNames = Array.from(new Set(scheduleTemplates.map(t => t.className).filter(Boolean)));
  const defaultClassNames = [
    'Kids Taekwondo',
    'Little Kids Karate',
    'Kids Karate',
    'Adult Karate',
    'Adult Kickboxing',
    'Kung Fu',
    'Zumba Fitness'
  ];
  const uniqueClassNames = Array.from(new Set([...defaultClassNames, ...existingClassNames]));

  useEffect(() => {
    const timer = setInterval(() => {
      const inProgress = sessions.find(s => s.status === 'in-progress');
      if (inProgress) {
        const now = new Date();
        const diff = differenceInMinutes(inProgress.end, now);
        if (diff > 0) {
          const hours = Math.floor(diff / 60);
          const mins = diff % 60;
          setTimeLeft(`${hours > 0 ? `${hours}h ` : ''}${mins}m remaining`);
        } else {
          setTimeLeft('Session ended');
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [sessions]);

  const navigateDate = (direction) => {
    if (view === 'day') {
      setCurrentDate(prev => direction === 'next' ? addDays(prev, 1) : addDays(prev, -1));
    } else if (view === 'week') {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : subWeeks(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : subMonths(prev, 1));
    }
  };

  const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

  const parseTimeToDay = (targetDay, timeStr) => {
    let start = new Date(targetDay);
    let end = new Date(targetDay);

    const parseTimeComponent = (str, baseDate) => {
      if (!str) return null;
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
      } else {
        const h = parseInt(trimmed, 10);
        hours = isNaN(h) ? 10 : h;
        minutes = 0;
      }

      const d = new Date(baseDate);
      d.setHours(hours, minutes, 0, 0);
      return d;
    };

    if (timeStr && timeStr.includes(' - ')) {
      const [startStr, endStr] = timeStr.split(' - ');
      const parsedStart = parseTimeComponent(startStr, targetDay);
      const parsedEnd = parseTimeComponent(endStr, targetDay);
      if (parsedStart) start = parsedStart;
      if (parsedEnd) end = parsedEnd;
    } else if (timeStr) {
      const parsedStart = parseTimeComponent(timeStr, targetDay);
      if (parsedStart) {
        start = parsedStart;
        end = new Date(start.getTime() + 90 * 60 * 1000); // 90 min default session
      }
    } else {
      start.setHours(10, 0, 0, 0);
      end.setHours(11, 30, 0, 0);
    }

    return { start, end };
  };

  const getSessionsForDay = (day) => {
    const directSessions = (sessions || []).filter(session => isSameDay(session.start, day));
    const dayNameShort = format(day, 'EEE');
    const dayNameFull = format(day, 'EEEE');

    const projectedSessions = (scheduleTemplates || []).map(template => {
      if (!template) return null;
      const tDays = Array.isArray(template.days)
        ? template.days
        : (typeof template.days === 'string' ? template.days.split(',').map(s => s.trim()) : []);

      const matchesDay = tDays.some(d => {
        const dl = d.toLowerCase();
        const shortL = dayNameShort.toLowerCase();
        const fullL = dayNameFull.toLowerCase();
        return dl.startsWith(shortL) || shortL.startsWith(dl) || dl === fullL;
      });

      if (!matchesDay) return null;

      const exists = directSessions.some(s => 
        s.template_id === template.id || 
        (s.title && s.title.toLowerCase() === (template.className || template.title || '').toLowerCase())
      );
      if (exists) return null;

      const { start, end } = parseTimeToDay(day, template.time);
      const now = new Date();
      let status = 'upcoming';
      if (isSameDay(day, now)) {
        if (now >= start && now <= end) {
          status = 'in-progress';
        } else if (now > end) {
          status = 'completed';
        }
      } else if (day < startOfDay(now)) {
        status = 'completed';
      }

      return {
        id: `template-${template.id}-${format(day, 'yyyy-MM-dd')}`,
        template_id: template.id,
        title: template.className || template.title || 'Group Class',
        trainer: template.trainer || 'Coach',
        location: template.location || 'Main Studio',
        start,
        end,
        status,
        type: 'group',
        capacity: template.capacity || 20,
        enrolled: template.enrolled || 0,
        checklist: [
          { id: 1, text: 'Roll call & attendance check', checked: false },
          { id: 2, text: 'Warm-up & stretching sequence', checked: false },
          { id: 3, text: 'Curriculum instruction & drills', checked: false },
          { id: 4, text: 'Cool down & progress logging', checked: false }
        ]
      };
    }).filter(Boolean);

    const combined = [...directSessions, ...projectedSessions];
    return combined.sort((a, b) => new Date(a.start) - new Date(b.start));
  };

  return (
    <div className="animate-in fade-in duration-700">
      <ScheduleHeader 
        view={view}
        setView={setView}
        currentDate={currentDate}
        setCurrentDate={setCurrentDate}
        navigateDate={navigateDate}
      />
      
      {view === 'week' && (
        <WeekView 
          currentDate={currentDate}
          hours={hours}
          getSessionsForDay={getSessionsForDay}
          setSelectedSession={setSelectedSession}
        />
      )}
      {view === 'month' && (
        <MonthView 
          currentDate={currentDate}
          getSessionsForDay={getSessionsForDay}
          setSelectedSession={setSelectedSession}
        />
      )}
      {view === 'day' && (
        <DayView 
          currentDate={currentDate}
          getSessionsForDay={getSessionsForDay}
          sessions={sessions}
          setSelectedSession={setSelectedSession}
          timeLeft={timeLeft}
        />
      )}
      {view === 'templates' && (
        <TemplatesView 
          scheduleTemplates={scheduleTemplates}
          members={members}
          selectedTemplateCategory={selectedTemplateCategory}
          setSelectedTemplateCategory={setSelectedTemplateCategory}
          setIsCreateModalOpen={setIsCreateModalOpen}
          handleEditClick={handleEditClick}
          setDeleteTemplateId={setDeleteTemplateId}
        />
      )}

      <DeleteTemplateModal 
        deleteTemplateId={deleteTemplateId}
        setDeleteTemplateId={setDeleteTemplateId}
        onDeleteTemplate={onDeleteTemplate}
      />

      <TemplateModal 
        isOpen={isCreateModalOpen}
        handleCloseModal={handleCloseModal}
        editingTemplate={editingTemplate}
        selectedClassOption={selectedClassOption}
        setSelectedClassOption={setSelectedClassOption}
        uniqueClassNames={uniqueClassNames}
        selectedDays={selectedDays}
        setSelectedDays={setSelectedDays}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        capacity={capacity}
        setCapacity={setCapacity}
        onAddTemplate={onAddTemplate}
        onUpdateTemplate={onUpdateTemplate}
      />

      <SessionModal 
        selectedSession={selectedSession}
        setSelectedSession={setSelectedSession}
        localChecklists={localChecklists}
        handleToggleChecklist={handleToggleChecklist}
        handleDeleteChecklistItem={handleDeleteChecklistItem}
        handleAddChecklistItem={handleAddChecklistItem}
        members={members}
        timeLeft={timeLeft}
        onUpdateSessionStatus={onUpdateSessionStatus}
      />
    </div>
  );
};

export default Schedule;
