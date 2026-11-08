import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, Loader2, Lightbulb, AlertCircle } from 'lucide-react';
import api from '../api/apiClient';
import toast from 'react-hot-toast';

export const SmartVisitDrawer = ({
  isOpen,
  onClose,
  circleId,
  onVisitParsed,
}) => {
  const [promptText, setPromptText] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const samplePrompts = [
    'Priya to take Mom to the orthopedic clinic next Tuesday 3 to 4pm and pick up medicines',
    'David to bring low-sodium groceries this Thursday at 11am and tidy the kitchen pantry',
    'Sarah for morning medication check and companion breakfast tomorrow from 8:30am to 10am',
  ];

  const handleParse = async (e) => {
    e?.preventDefault();
    if (!promptText.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await api.post('/ai/parse-visit', {
        text: promptText,
        circleId,
      });

      if (res.data?.success && res.data.data) {
        toast.success('Visit details extracted! Review before saving.');
        onVisitParsed(res.data.data);
        onClose();
        setPromptText('');
      } else {
        setErrorMsg(
          res.data?.message || 'Could not parse text automatically. Please use the standard visit form.'
        );
      }
    } catch (err) {
      setErrorMsg('Failed to connect to Gemini AI. You can enter details manually.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Smart Visit Entry
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Type or speak in plain English — Gemini creates the structured visit
            </p>
          </div>
        </div>

        <form onSubmit={handleParse} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              What visit do you want to schedule?
            </label>
            <textarea
              rows={3}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="e.g. Priya to take Mom to the clinic next Tuesday 3 to 4pm and pick up medicines"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Try an example:
            </span>
            <div className="space-y-1.5">
              {samplePrompts.map((sample, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setPromptText(sample)}
                  className="w-full text-left text-xs p-2 rounded-lg bg-slate-100 dark:bg-slate-800/70 hover:bg-blue-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-800 transition line-clamp-1"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Never saved automatically — you review first
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !promptText.trim()}
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg shadow-sm transition inline-flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Extracting...
                  </>
                ) : (
                  <>
                    Parse & Review
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
