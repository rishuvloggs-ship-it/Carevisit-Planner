import { Visit } from '../models/Visit.js';
import { Task } from '../models/Task.js';
import { isDBConnected } from '../config/db.js';
import { mockStore } from '../services/mockDataService.js';
import { asyncWrapper } from '../middleware/errorHandler.js';

export const getCircleTimeline = asyncWrapper(async (req, res) => {
  const circleId = req.params.circleId || req.params.id;
  const { startDate, endDate, caregiverId, status } = req.query;

  if (isDBConnected()) {
    const visitFilter = { circleId };
    if (startDate && endDate) {
      visitFilter.startTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (startDate) {
      visitFilter.startTime = { $gte: new Date(startDate) };
    }
    if (caregiverId) visitFilter.caregiverId = caregiverId;
    if (status) visitFilter.status = status;

    const visits = await Visit.find(visitFilter)
      .populate('caregiverId', 'name email avatarColor phone')
      .sort({ startTime: -1 })
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

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return res.json({
      success: true,
      data: {
        stats: {
          totalVisits: visits.length,
          completedVisits: visits.filter((v) => v.status === 'Completed').length,
          totalTasks,
          completedTasks,
          completionPercentage,
        },
        timeline: timelineEntries,
        careRecipient: req.circle?.careRecipient,
      },
    });
  }

  // In-memory fallback
  let visits = mockStore.getVisits(circleId, { caregiverId, status });
  visits = [...visits].reverse();

  let totalTasks = 0;
  let completedTasks = 0;

  const timelineEntries = visits.map((visit) => {
    const vTasks = mockStore.getTasksForVisit(visit._id);
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

  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  res.json({
    success: true,
    data: {
      stats: {
        totalVisits: visits.length,
        completedVisits: visits.filter((v) => v.status === 'Completed').length,
        totalTasks,
        completedTasks,
        completionPercentage,
      },
      timeline: timelineEntries,
      careRecipient: mockStore.careCircle.careRecipient,
    },
  });
});
