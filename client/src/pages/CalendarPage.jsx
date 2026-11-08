import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import {
  Calendar as CalendarIcon,
  Filter,
  AlertTriangle,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/apiClient';

export const CalendarPage = ({ onOpenNewVisit, onSelectVisit, onOpenSmartEntry }) => {
  const { activeCircle, currentRole } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCaregiver, setSelectedCaregiver] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const calendarRef = useRef(null);

  const fetchVisits = async () => {
    if (!activeCircle?._id) return;
    try {
      const res = await api.get(`/circles/${activeCircle._id}/visits`);
      if (res.data?.success) {
        setVisits(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading calendar visits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [activeCircle]);

  // Adjust view based on screen size on mount
  useEffect(() => {
    const handleResize = () => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        if (window.innerWidth < 768) {
          calendarApi.changeView('listMonth');
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter visits
  const filteredVisits = visits.filter((v) => {
    if (selectedCaregiver !== 'ALL') {
      const cId = v.caregiverId?._id || v.caregiverId;
      if (cId !== selectedCaregiver) return false;
    }
    if (selectedCategory !== 'ALL' && v.category !== selectedCategory) {
      return false;
    }
    return true;
  });

  // Map to FullCalendar events
  const calendarEvents = filteredVisits.map((v) => {
    const caregiverColor = v.caregiverId?.avatarColor || '#3B82F6';
    const isConflict = v.hasConflict;

    return {
      id: v._id,
      title: `${isConflict ? '⚠️ ' : ''}${v.title} (${v.caregiverId?.name || 'Unassigned'})`,
      start: v.startTime,
      end: v.endTime,
      backgroundColor: isConflict ? '#D97706' : caregiverColor, // Amber if conflict
      borderColor: isConflict ? '#B45309' : caregiverColor,
      textColor: '#FFFFFF',
      extendedProps: {
        visit: v,
        isConflict,
      },
    };
  });

  const handleDateClick = (arg) => {
    if (currentRole === 'Viewer') return;
    const clickedDate = new Date(arg.date);
    onOpenNewVisit({
      startTime: clickedDate.toISOString(),
      endTime: new Date(clickedDate.getTime() + 60 * 60 * 1000).toISOString(),
    });
  };

  const handleEventClick = (info) => {
    const visitDoc = info.event.extendedProps?.visit;
    if (visitDoc) {
      onSelectVisit(visitDoc);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Shared Care Calendar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Click any time slot or date to schedule a visit • Amber events indicate scheduling overlaps
          </p>
        </div>

        {currentRole !== 'Viewer' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenSmartEntry}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 hover:from-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900 transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Smart Entry
            </button>
            <button
              type="button"
              onClick={() => onOpenNewVisit()}
              className="px-4 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-md shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Schedule Visit
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Caregiver Filter */}
          <select
            value={selectedCaregiver}
            onChange={(e) => setSelectedCaregiver(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
          >
            <option value="ALL">All Caregivers</option>
            {activeCircle?.members?.map((m) => (
              <option key={m.userId?._id} value={m.userId?._id}>
                {m.userId?.name}
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            <option value="Companionship">Companionship</option>
            <option value="Grocery & Meals">Grocery & Meals</option>
            <option value="Medication Reminder">Medication Reminder</option>
            <option value="Light Household Help">Light Household Help</option>
            <option value="Transport & Appointments">Transport & Appointments</option>
            <option value="Personal Care">Personal Care</option>
          </select>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Standard Visit
          </span>
          <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Overlap / Conflict
          </span>
        </div>
      </div>

      {/* Calendar Card Container */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={window.innerWidth < 768 ? 'listMonth' : 'dayGridMonth'}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
          }}
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            list: 'Agenda List',
          }}
          events={calendarEvents}
          editable={false}
          selectable={currentRole !== 'Viewer'}
          selectMirror={true}
          dayMaxEvents={3}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          height="auto"
          eventTimeFormat={{
            hour: 'numeric',
            minute: '2-digit',
            meridiem: 'short',
          }}
        />
      </div>
    </div>
  );
};
