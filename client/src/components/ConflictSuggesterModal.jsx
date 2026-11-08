import React, { useState, useEffect } from 'react';
import { X, Sparkles, Clock, Check, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/apiClient';
import toast from 'react-hot-toast';

export const ConflictSuggesterModal = ({
  isOpen,
  onClose,
  circleId,
  startTime,
  endTime,
  onSelectSlot,
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (isOpen && startTime && endTime && circleId) {
      fetchSuggestions();
    }
  }, [isOpen, startTime, endTime, circleId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await api.post('/ai/suggest-slots', {
        circleId,
        startTime,
        endTime,
      });

      if (res.data?.success && Array.isArray(res.data.data)) {
        setSuggestions(res.data.data);
      } else {
        setErrorMsg(
          res.data?.message || 'Could not find alternative slots automatically.'
        );
      }
    } catch (err) {
      setErrorMsg('Failed to reach Gemini scheduling assistant.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Gemini Conflict Resolver
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Suggested conflict-free alternative time slots
            </p>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Analyzing care circle schedule...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Finding daytime slots that avoid overlaps
              </p>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMsg}</p>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">
                  You can adjust the time manually in the visit form.
                </p>
              </div>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="py-6 text-center text-slate-500 dark:text-slate-400 text-sm">
              No alternative daytime slots found for this date.
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Select an alternative slot to automatically update this visit:
              </p>
              {suggestions.map((slot, index) => {
                const sDate = new Date(slot.startTime);
                const eDate = new Date(slot.endTime);
                const timeLabel = `${sDate.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })} - ${eDate.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}`;

                return (
                  <button
                    key={index}
                    onClick={() => {
                      onSelectSlot(slot.startTime, slot.endTime);
                      toast.success(`Updated time slot to ${timeLabel}`);
                      onClose();
                    }}
                    className="w-full text-left p-3.5 rounded-xl border border-blue-100 dark:border-slate-800 bg-blue-50/50 dark:bg-slate-800/60 hover:bg-blue-100/70 dark:hover:bg-slate-800 hover:border-blue-300 transition flex items-center justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 text-sm">
                        <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>{timeLabel}</span>
                      </div>
                      {slot.reason && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {slot.reason}
                        </p>
                      )}
                    </div>
                    <span className="opacity-0 group-hover:opacity-100 p-1.5 bg-blue-600 text-white rounded-lg transition">
                      <Check className="w-4 h-4" />
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 dark:text-slate-500">
          <span>AI suggestions should be reviewed</span>
          <button
            onClick={onClose}
            className="text-slate-600 dark:text-slate-300 font-medium hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
