import React from 'react';
import { AlertCircle, Clock, Sparkles } from 'lucide-react';

export const ConflictWarningBanner = ({
  conflicts = [],
  onAdjustTime,
  onSaveAnyway,
  onRequestAISuggestions,
  isSubmitting = false,
  showActions = true,
}) => {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl p-4 my-3 text-amber-950 dark:text-amber-100 shadow-sm animate-fade-in">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-200 dark:bg-amber-800/60 rounded-lg text-amber-800 dark:text-amber-200 flex-shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">
              Scheduling Overlap Detected ({conflicts.length})
            </h4>
            <span className="bg-amber-200/80 dark:bg-amber-800/80 text-amber-900 dark:text-amber-200 text-xs px-2 py-0.5 rounded-full font-semibold">
              Conflict Warning
            </span>
          </div>
          <p className="text-xs text-amber-800/90 dark:text-amber-200/80 mb-2">
            The selected visit time overlaps with an existing appointment for the care recipient or double-books an assigned caregiver:
          </p>

          <ul className="space-y-1.5 text-xs text-amber-900 dark:text-amber-100 mb-3 bg-amber-100/60 dark:bg-amber-900/30 p-2.5 rounded-lg border border-amber-200 dark:border-amber-800/60">
            {conflicts.map((c, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400"></span>
                <span>{c.message || 'Overlapping appointment in this circle'}</span>
              </li>
            ))}
          </ul>

          {showActions && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {onAdjustTime && (
                <button
                  type="button"
                  onClick={onAdjustTime}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-100 text-xs font-semibold rounded-lg border border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-slate-700 transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Adjust Time
                </button>
              )}

              {onRequestAISuggestions && (
                <button
                  type="button"
                  onClick={onRequestAISuggestions}
                  className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition shadow-sm inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini Alternative Slots
                </button>
              )}

              {onSaveAnyway && (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onSaveAnyway}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg transition shadow-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Save Anyway (Flagged)'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
