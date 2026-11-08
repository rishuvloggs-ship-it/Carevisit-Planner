import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Send,
  Loader2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/apiClient';
import toast from 'react-hot-toast';

export const AiSummaryPage = () => {
  const { activeCircle, currentRole } = useAuth();
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);

  // Handover Note Polisher State
  const [roughNotes, setRoughNotes] = useState('');
  const [visitTitle, setVisitTitle] = useState('');
  const [polishedNote, setPolishedNote] = useState('');
  const [polishing, setPolishing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchSummary = async (force = false) => {
    if (!activeCircle?._id) return;
    if (force) setRegenerating(true);
    else setLoading(true);

    try {
      const res = await api.get(`/circles/${activeCircle._id}/ai/weekly-summary`, {
        params: { forceRegenerate: force ? 'true' : 'false' },
      });

      if (res.data?.success && res.data.data) {
        setSummaryData(res.data.data.summary || res.data.data);
        setGeneratedAt(res.data.generatedAt || new Date());
        if (force) toast.success('Weekly care summary regenerated with latest data!');
      }
    } catch (err) {
      console.error('Error fetching AI summary:', err);
    } finally {
      setLoading(false);
      setRegenerating(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [activeCircle]);

  const handlePolishHandover = async (e) => {
    e.preventDefault();
    if (!roughNotes.trim()) return;

    setPolishing(true);
    try {
      const res = await api.post('/ai/handover-note', {
        roughNotes,
        visitTitle: visitTitle || 'Routine Care Visit',
        circleId: activeCircle?._id,
      });

      if (res.data?.success && res.data.data?.polishedNote) {
        setPolishedNote(res.data.data.polishedNote);
        toast.success('Handover note polished!');
      } else {
        toast.error('Could not polish note. Try again or edit manually.');
      }
    } catch (err) {
      // handled
    } finally {
      setPolishing(false);
    }
  };

  const copyToClipboard = () => {
    if (!polishedNote) return;
    navigator.clipboard.writeText(polishedNote);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            AI Care Coordination Insights
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Powered by Google Gemini 3.8 Flash • Automated weekly summaries and caregiver handovers
          </p>
        </div>

        {currentRole !== 'Viewer' && (
          <button
            type="button"
            onClick={() => fetchSummary(true)}
            disabled={regenerating || loading}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Analyzing Week...' : 'Regenerate Summary'}
          </button>
        )}
      </div>

      {/* Safety & Medical Disclaimer Banner */}
      <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-slate-800/50 border border-blue-200/80 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">
            Advisory Notice:
          </span>{' '}
          All AI summaries are generated strictly for logistical coordination and routine oversight.
          Gemini does not provide clinical diagnoses, medical advice, or dosage changes. AI
          recommendations should always be reviewed by circle members.
        </div>
      </div>

      {/* Section 1: Weekly Care Coordination Summary */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Weekly Care Coordination Summary
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Plain-language overview of visits completed, routines, and patterns for{' '}
              <span className="font-semibold">{activeCircle?.careRecipient?.name}</span>
            </p>
          </div>

          {generatedAt && (
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Generated: {new Date(generatedAt).toLocaleDateString()} at{' '}
              {new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Synthesizing weekly care events with Gemini...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Aggregating visits, tasks, and caregiver notes
            </p>
          </div>
        ) : summaryData ? (
          <div className="prose dark:prose-invert max-w-none text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {summaryData}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-sm">
            No summary generated yet. Click "Regenerate Summary" to analyze recent visits.
          </div>
        )}
      </div>

      {/* Section 2: Handover Notes Polisher */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Caregiver Handover Polisher
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Convert rough visit observations into a structured, polite handover for the next caregiver
            </p>
          </div>
        </div>

        <form onSubmit={handlePolishHandover} className="space-y-3 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Visit Context
              </label>
              <input
                type="text"
                value={visitTitle}
                onChange={(e) => setVisitTitle(e.target.value)}
                placeholder="e.g. Afternoon Tea & PT Stretches"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Rough Notes / Observations
              </label>
              <input
                type="text"
                value={roughNotes}
                onChange={(e) => setRoughNotes(e.target.value)}
                placeholder="e.g. Mom finished half tomato soup, took 2pm BP pill, walked garden 15 min, left laundry folded"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={polishing || !roughNotes.trim()}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition flex items-center gap-1.5 shadow-md shadow-purple-500/20 disabled:opacity-50"
            >
              {polishing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Polishing Note...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Format Handover Note
                </>
              )}
            </button>
          </div>
        </form>

        {polishedNote && (
          <div className="mt-4 p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/60 relative animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-purple-900 dark:text-purple-300 uppercase tracking-wider">
                Polished Handover Format
              </span>
              <button
                type="button"
                onClick={copyToClipboard}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 transition flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Note'}
              </button>
            </div>
            <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {polishedNote}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
