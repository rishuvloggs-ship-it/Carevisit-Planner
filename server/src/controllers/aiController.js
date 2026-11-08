import {
  parseVisitNaturalLanguage,
  suggestAlternativeSlots,
  generateWeeklyCareSummary,
  polishHandoverNote,
} from '../services/aiService.js';
import { CareCircle } from '../models/CareCircle.js';
import { Visit } from '../models/Visit.js';
import { Task } from '../models/Task.js';
import { AiSummary } from '../models/AiSummary.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { asyncWrapper } from '../middleware/errorHandler.js';

export const parseVisit = asyncWrapper(async (req, res) => {
  const { text, circleId } = req.body;

  let caregivers = [];
  let recipientName = 'Care Recipient';

  if (circleId) {
    const circle = await CareCircle.findById(circleId).populate('members.userId', 'name email');
    if (circle) {
      caregivers = circle.members.map((m) => ({
        id: m.userId?._id,
        name: m.userId?.name,
        email: m.userId?.email,
      }));
      recipientName = circle.careRecipient?.name || recipientName;
    }
  }

  const result = await parseVisitNaturalLanguage({
    text,
    caregivers,
    recipientName,
  });

  res.json(result);
});

export const suggestSlots = asyncWrapper(async (req, res) => {
  const { circleId, startTime, endTime } = req.body;

  const start = new Date(startTime);
  const end = new Date(endTime);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / (60 * 1000));
  const targetDate = start.toISOString().split('T')[0];

  // Fetch all non-cancelled visits for this day to identify busy slots (only send timestamps)
  const dayStart = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0);
  const dayEnd = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 23, 59, 59);

  const existingVisits = await Visit.find({
    circleId,
    status: { $ne: 'Cancelled' },
    startTime: { $gte: dayStart, $lte: dayEnd },
  }).select('startTime endTime');

  const busySlots = existingVisits.map((v) => ({
    startTime: v.startTime.toISOString(),
    endTime: v.endTime.toISOString(),
  }));

  const result = await suggestAlternativeSlots({
    desiredDurationMinutes: durationMinutes || 60,
    busySlots,
    targetDate,
  });

  res.json(result);
});

export const getWeeklySummary = asyncWrapper(async (req, res) => {
  const circleId = req.params.circleId || req.params.id || req.query.circleId;
  const { forceRegenerate } = req.query;

  const now = new Date();
  const pastSevenDays = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Check cache unless forced
  if (forceRegenerate !== 'true') {
    const cached = await AiSummary.findOne({
      circleId,
      type: 'weekly_summary',
      generatedAt: { $gte: new Date(now.getTime() - 12 * 60 * 60 * 1000) }, // valid for 12 hours
    }).sort({ generatedAt: -1 });

    if (cached) {
      return res.json({
        success: true,
        cached: true,
        data: cached.content,
        generatedAt: cached.generatedAt,
      });
    }
  }

  const circle = await CareCircle.findById(circleId);
  if (!circle) {
    return res.status(404).json({
      success: false,
      message: 'Care Circle not found',
    });
  }

  // Gather past 7 days data
  const visits = await Visit.find({
    circleId,
    startTime: { $gte: pastSevenDays, $lte: now },
  }).populate('caregiverId', 'name');

  const visitIds = visits.map((v) => v._id);
  const tasks = await Task.find({
    circleId,
    visitId: { $in: visitIds },
  });

  const completedVisits = visits.filter((v) => v.status === 'Completed').length;
  const missedOrCancelled = visits.filter(
    (v) => v.status === 'Missed' || v.status === 'Cancelled'
  ).length;

  const completedTasks = tasks.filter((t) => t.isCompleted);
  const missedTasks = tasks.filter((t) => !t.isCompleted);

  const visitStats = {
    total: visits.length,
    completed: completedVisits,
    missedOrCancelled,
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 100,
  };

  const notesSummary = visits
    .filter((v) => v.completedNotes || v.notes)
    .map((v) => v.completedNotes || v.notes);

  const aiResult = await generateWeeklyCareSummary({
    recipientName: circle.careRecipient?.name || 'Care Recipient',
    startDate: pastSevenDays.toISOString().split('T')[0],
    endDate: now.toISOString().split('T')[0],
    visitStats,
    completedTasks: completedTasks.map((t) => t.description),
    missedTasks: missedTasks.map((t) => t.description),
    notesSummary,
  });

  if (aiResult.success) {
    // Save to cache
    await AiSummary.create({
      circleId,
      type: 'weekly_summary',
      content: aiResult.data,
      startDate: pastSevenDays,
      endDate: now,
      generatedAt: new Date(),
    });

    await ActivityLog.create({
      circleId,
      action: 'AI_SUMMARY_GENERATED',
      performedBy: req.user._id,
      details: `${req.user.name} generated a weekly AI care summary`,
    });
  }

  res.json(aiResult);
});

export const handoverNote = asyncWrapper(async (req, res) => {
  const { roughNotes, visitTitle, circleId } = req.body;

  let recipientName = 'Care Recipient';
  if (circleId) {
    const circle = await CareCircle.findById(circleId);
    if (circle?.careRecipient?.name) {
      recipientName = circle.careRecipient.name;
    }
  }

  const result = await polishHandoverNote({
    roughNotes,
    visitTitle: visitTitle || 'Care Visit',
    recipientName,
  });

  res.json(result);
});
