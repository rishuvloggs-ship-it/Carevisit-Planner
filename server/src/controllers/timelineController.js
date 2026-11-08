import { Visit } from '../models/Visit.js';
import { Task } from '../models/Task.js';
import { asyncWrapper } from '../middleware/errorHandler.js';

export const getCircleTimeline = asyncWrapper(async (req, res) => {
  const circleId = req.params.circleId || req.params.id;
  const { startDate, endDate, caregiverId, status } = req.query;

  const visitFilter = { circleId };

  if (startDate && endDate) {
    visitFilter.startTime = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  } else if (startDate) {
    visitFilter.startTime = { $gte: new Date(startDate) };
  }

  if (caregiverId) {
    visitFilter.caregiverId = caregiverId;
  }

  if (status) {
    visitFilter.status = status;
  }

  // Get visits in chronological order (or descending if specified)
  const visits = await Visit.find(visitFilter)
    .populate('caregiverId', 'name email avatarColor phone')
    .sort({ startTime: -1 }) // most recent first for timeline
    .lean();

  const visitIds = visits.map((v) => v._id);
  const tasks = await Task.find({ visitId: { $in: visitIds } })
    .populate('completedBy', 'name email avatarColor')
    .sort({ createdAt: 1 })
    .lean();

  const tasksByVisit = {};
  for (const t of tasks) {
    const vId = t.visitId.toString();
    if (!tasksByVisit[vId]) tasksByVisit[vId] = [];
    tasksByVisit[vId].push(t);
  }

  let totalTasks = 0;
  let completedTasks = 0;

  const timelineEntries = visits.map((visit) => {
    const vTasks = tasksByVisit[visit._id.toString()] || [];
    const vCompleted = vTasks.filter((t) => t.isCompleted).length;

    totalTasks += vTasks.length;
    completedTasks += vCompleted;

    return {
      ...visit,
      tasks: vTasks,
      totalTasks: vTasks.length,
      completedTasks: vCompleted,
      completionRate: vTasks.length > 0 ? Math.round((vCompleted / vTasks.length) * 100) : 100,
    };
  });

  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const stats = {
    totalVisits: visits.length,
    completedVisits: visits.filter((v) => v.status === 'Completed').length,
    inProgressVisits: visits.filter((v) => v.status === 'In Progress').length,
    scheduledVisits: visits.filter((v) => v.status === 'Scheduled').length,
    missedVisits: visits.filter((v) => v.status === 'Missed').length,
    cancelledVisits: visits.filter((v) => v.status === 'Cancelled').length,
    totalTasks,
    completedTasks,
    completionPercentage,
  };

  res.json({
    success: true,
    data: {
      stats,
      timeline: timelineEntries,
      careRecipient: req.circle?.careRecipient,
    },
  });
});
