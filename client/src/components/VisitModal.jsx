import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  FileText,
  ListPlus,
  Trash2,
  AlertTriangle,
  Repeat,
  Sparkles,
} from 'lucide-react';
import api from '../api/apiClient';
import { ConflictWarningBanner } from './ConflictWarningBanner';
import { ConflictSuggesterModal } from './ConflictSuggesterModal';
import { TaskChecklistItem } from './TaskChecklistItem';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'General Check-in',
  'Companionship',
  'Grocery & Meals',
  'Medication Reminder',
  'Light Household Help',
  'Transport & Appointments',
  'Personal Care',
];

const STATUSES = ['Scheduled', 'In Progress', 'Completed', 'Missed', 'Cancelled'];

export const VisitModal = ({
  isOpen,
  onClose,
  circle,
  visit = null, // if provided, editing mode
  initialStartTime = null,
  initialEndTime = null,
  prefilledData = null, // from Smart Visit Entry
  onSaved,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'General Check-in',
    caregiverId: '',
    startTime: '',
    endTime: '',
    location: 'Home',
    notes: '',
    status: 'Scheduled',
    completedNotes: '',
    recurrenceFreq: 'none',
    recurrenceUntil: '',
  });

  const [tasks, setTasks] = useState([]);
  const [newTaskInput, setNewTaskInput] = useState('');
  const [conflicts, setConflicts] = useState([]);
  const [hasConflict, setHasConflict] = useState(false);
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSlotSuggester, setShowSlotSuggester] = useState(false);

  // Helper to format Date to input datetime-local string (YYYY-MM-DDTHH:mm)
  const toLocalISOString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Populate form on open or when editing visit
  useEffect(() => {
    if (!isOpen) return;

    if (visit) {
      setFormData({
        title: visit.title || '',
        category: visit.category || 'General Check-in',
        caregiverId: visit.caregiverId?._id || visit.caregiverId || '',
        startTime: toLocalISOString(visit.startTime),
        endTime: toLocalISOString(visit.endTime),
        location: visit.location || 'Home',
        notes: visit.notes || '',
        status: visit.status || 'Scheduled',
        completedNotes: visit.completedNotes || '',
        recurrenceFreq: visit.recurrence?.frequency || 'none',
        recurrenceUntil: visit.recurrence?.until ? toLocalISOString(visit.recurrence.until).split('T')[0] : '',
      });
      setTasks(visit.tasks || []);
      setConflicts([]);
      setHasConflict(false);
    } else if (prefilledData) {
      // Find caregiver ID by name if matched
      let matchedCaregiverId = '';
      if (prefilledData.caregiverName && circle?.members) {
        const found = circle.members.find(
          (m) =>
            m.userId?.name &&
            m.userId.name.toLowerCase().includes(prefilledData.caregiverName.toLowerCase())
        );
        if (found) matchedCaregiverId = found.userId._id;
      }

      setFormData({
        title: prefilledData.title || '',
        category: prefilledData.category || 'General Check-in',
        caregiverId: matchedCaregiverId || circle?.members?.[0]?.userId?._id || '',
        startTime: toLocalISOString(prefilledData.startTime),
        endTime: toLocalISOString(prefilledData.endTime),
        location: prefilledData.location || 'Home',
        notes: prefilledData.notes || '',
        status: 'Scheduled',
        completedNotes: '',
        recurrenceFreq: 'none',
        recurrenceUntil: '',
      });

      setTasks(
        (prefilledData.tasks || []).map((desc) => ({
          _id: 'temp_' + Math.random(),
          description: desc,
          isCompleted: false,
        }))
      );
    } else {
      const defaultStart = initialStartTime ? new Date(initialStartTime) : new Date();
      if (!initialStartTime) {
        defaultStart.setMinutes(0, 0, 0);
        defaultStart.setHours(defaultStart.getHours() + 1);
      }
      const defaultEnd = initialEndTime
        ? new Date(initialEndTime)
        : new Date(defaultStart.getTime() + 60 * 60 * 1000);

      setFormData({
        title: '',
        category: 'General Check-in',
        caregiverId: circle?.members?.[0]?.userId?._id || '',
        startTime: toLocalISOString(defaultStart),
        endTime: toLocalISOString(defaultEnd),
        location: 'Home',
        notes: '',
        status: 'Scheduled',
        completedNotes: '',
        recurrenceFreq: 'none',
        recurrenceUntil: '',
      });
      setTasks([]);
      setConflicts([]);
      setHasConflict(false);
    }
  }, [isOpen, visit, prefilledData, initialStartTime, initialEndTime, circle]);

  // Real-time conflict preview checker
  const checkConflicts = useCallback(
    async (startStr, endStr, caregiverIdVal) => {
      if (!circle?._id || !startStr || !endStr) return;
      const s = new Date(startStr);
      const e = new Date(endStr);
      if (isNaN(s.getTime()) || isNaN(e.getTime()) || s >= e) {
        setConflicts([]);
        setHasConflict(false);
        return;
      }

      setIsCheckingConflicts(true);
      try {
        const res = await api.post('/visits/check-conflicts', {
          circleId: circle._id,
          caregiverId: caregiverIdVal || undefined,
          startTime: s.toISOString(),
          endTime: e.toISOString(),
          excludeVisitId: visit?._id || null,
        });

        if (res.data?.success && res.data.data?.hasConflict) {
          setHasConflict(true);
          setConflicts(res.data.data.conflicts || []);
        } else {
          setHasConflict(false);
          setConflicts([]);
        }
      } catch (err) {
        // silent preview error
      } finally {
        setIsCheckingConflicts(false);
      }
    },
    [circle, visit]
  );

  // Trigger conflict check when time or caregiver changes
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const timer = setTimeout(() => {
        checkConflicts(formData.startTime, formData.endTime, formData.caregiverId);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [formData.startTime, formData.endTime, formData.caregiverId, checkConflicts]);

  const handleAddTask = (e) => {
    e?.preventDefault();
    if (!newTaskInput.trim()) return;

    const newTaskObj = {
      _id: 'temp_' + Date.now(),
      description: newTaskInput.trim(),
      isCompleted: false,
    };

    setTasks((prev) => [...prev, newTaskObj]);
    setNewTaskInput('');
  };

  const handleRemoveTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
  };

  const handleSubmit = async (saveAnywayChoice = false) => {
    if (!formData.title.trim()) {
      toast.error('Please enter a visit title.');
      return;
    }
    if (!formData.caregiverId) {
      toast.error('Please select an assigned caregiver.');
      return;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error('Please provide valid start and end times.');
      return;
    }
    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      toast.error('End time must be after start time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        circleId: circle._id,
        caregiverId: formData.caregiverId,
        title: formData.title.trim(),
        category: formData.category,
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        location: formData.location.trim() || 'Home',
        notes: formData.notes.trim(),
        status: formData.status,
        completedNotes: formData.completedNotes.trim(),
        saveAnyway: saveAnywayChoice,
        tasks: tasks.map((t) => t.description),
        recurrence: {
          frequency: formData.recurrenceFreq,
          until: formData.recurrenceUntil ? new Date(formData.recurrenceUntil).toISOString() : null,
        },
      };

      if (visit?._id) {
        await api.put(`/visits/${visit._id}`, payload);
        toast.success('Visit updated successfully!');
      } else {
        await api.post(`/circles/${circle._id}/visits`, payload);
        toast.success('Visit scheduled successfully!');
      }

      onSaved();
      onClose();
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.hasConflict) {
        setHasConflict(true);
        setConflicts(err.response.data.data?.conflicts || []);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!visit?._id) return;
    if (!window.confirm('Are you sure you want to delete this visit and all its tasks?')) return;

    try {
      await api.delete(`/visits/${visit._id}`);
      toast.success('Visit deleted');
      onSaved();
      onClose();
    } catch (err) {
      // handled by apiClient
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {visit ? 'Edit Support Visit' : 'Schedule New Support Visit'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Care Recipient: <span className="font-semibold">{circle?.careRecipient?.name}</span>
            </p>
          </div>
        </div>

        {/* Conflict Warning Banner if real-time overlap is active */}
        {hasConflict && (
          <ConflictWarningBanner
            conflicts={conflicts}
            onAdjustTime={() => {
              toast('Adjust the start or end time below');
            }}
            onRequestAISuggestions={() => setShowSlotSuggester(true)}
            onSaveAnyway={() => handleSubmit(true)}
            isSubmitting={isSubmitting}
          />
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(false);
          }}
          className="space-y-4"
        >
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Visit Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Morning Medication & Light Breakfast"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Caregiver & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Assigned Caregiver *
              </label>
              <select
                required
                value={formData.caregiverId}
                onChange={(e) => setFormData({ ...formData, caregiverId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a caregiver...</option>
                {circle?.members?.map((m) => (
                  <option key={m.userId?._id} value={m.userId?._id}>
                    {m.userId?.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Visit Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Start Date & Time *</span>
                {isCheckingConflicts && (
                  <span className="text-[10px] text-blue-500 font-normal">Checking overlaps...</span>
                )}
              </label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Location & Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. Home, Clinic, Grocery Store"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instructions / Prep Notes
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Low sodium meal, ensure walker is nearby"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Post-visit Notes if visit is completed or in progress */}
          {(formData.status === 'Completed' || formData.status === 'In Progress') && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Post-Visit Observation / Caregiver Handover Notes
              </label>
              <textarea
                rows={2}
                value={formData.completedNotes}
                onChange={(e) => setFormData({ ...formData, completedNotes: e.target.value })}
                placeholder="How was Eleanor's mood, appetite, or vitals? Any notes for the next caregiver?"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          )}

          {/* Optional Recurrence */}
          {!visit && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <Repeat className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Optional Recurrence
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <select
                    value={formData.recurrenceFreq}
                    onChange={(e) => setFormData({ ...formData, recurrenceFreq: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="daily">Repeats Daily</option>
                    <option value="weekly">Repeats Weekly</option>
                  </select>
                </div>
                {formData.recurrenceFreq !== 'none' && (
                  <div>
                    <input
                      type="date"
                      required
                      value={formData.recurrenceUntil}
                      onChange={(e) => setFormData({ ...formData, recurrenceUntil: e.target.value })}
                      placeholder="Repeat until date"
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Visit Checklist Tasks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ListPlus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Checklist Tasks ({tasks.length})
              </label>
            </div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTask())}
                placeholder="Add actionable task (e.g. check blood pressure, prepare tea)..."
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddTask}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition"
              >
                Add
              </button>
            </div>

            {tasks.length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {task.description}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(task._id)}
                      className="text-slate-400 hover:text-rose-500 transition p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {visit ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Delete Visit
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowSlotSuggester(true)}
                className="px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                Find Optimal Slot
              </button>
            )}

            <div className="flex gap-2.5 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-md transition"
              >
                {isSubmitting
                  ? 'Saving...'
                  : hasConflict
                  ? 'Save Anyway (Flagged)'
                  : visit
                  ? 'Save Changes'
                  : 'Schedule Visit'}
              </button>
            </div>
          </div>
        </form>

        {/* Gemini Alternative Slots Modal */}
        <ConflictSuggesterModal
          isOpen={showSlotSuggester}
          onClose={() => setShowSlotSuggester(false)}
          circleId={circle?._id}
          startTime={formData.startTime}
          endTime={formData.endTime}
          onSelectSlot={(s, e) => {
            setFormData({
              ...formData,
              startTime: toLocalISOString(s),
              endTime: toLocalISOString(e),
            });
            setHasConflict(false);
            setConflicts([]);
          }}
        />
      </div>
    </div>
  );
};
