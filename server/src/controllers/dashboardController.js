import { Visit } from '../models/Visit.js';
import { Task } from '../models/Task.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { asyncWrapper } from '../middleware/errorHandler.js';

export const getCircleDashboard = asyncWrapper(async (req, res) => {
  const circleId = req.params.circleId || req.params.id;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startOfSevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Today's visits
  const todayVisits = await Visit.find({
    circleId,
    startTime: { $gte: startOfToday, $lte: endOfToday },
    status: { $ne: 'Cancelled' },
  })
    .populate('caregiverId', 'name email avatarColor phone')
    .sort({ startTime: 1 });

  // Upcoming visits this week (after today until end of week)
  const upcomingVisits = await Visit.find({
    circleId,
    startTime: { $gt: endOfToday, $lte: endOfWeek },
    status: { $ne: 'Cancelled' },
  })
    .populate('caregiverId', 'name email avatarColor phone')
    .sort({ startTime: 1 })
    .limit(10);

  // Visits with conflicts needing attention
  const conflictVisits = await Visit.find({
    circleId,
    hasConflict: true,
    status: { $nin: ['Completed', 'Cancelled'] },
  })
    .populate('caregiverId', 'name email avatarColor')
    .populate('conflictWith', 'title startTime endTime caregiverId')
    .sort({ startTime: 1 });

  // Recent activity log
  const recentActivity = await ActivityLog.find({ circleId })
    .populate('performedBy', 'name email avatarColor')
    .sort({ timestamp: -1 })
    .limit(12);

  // Weekly task completion metrics (last 7 days)
  const pastWeekVisits = await Visit.find({
    circleId,
    startTime: { $gte: startOfSevenDaysAgo, $lte: now },
  }).select('_id');

  const pastWeekVisitIds = pastWeekVisits.map((v) => v._id);
  const pastWeekTasks = await Task.find({
    circleId,
    visitId: { $in: pastWeekVisitIds },
  });

  const totalWeeklyTasks = pastWeekTasks.length;
  const completedWeeklyTasks = pastWeekTasks.filter((t) => t.isCompleted).length;
  const weeklyCompletionRate =
    totalWeeklyTasks > 0 ? Math.round((completedWeeklyTasks / totalWeeklyTasks) * 100) : 100;

  res.json({
    success: true,
    data: {
      todayVisits,
      upcomingVisits,
      conflictVisits,
      recentActivity,
      metrics: {
        totalWeeklyTasks,
        completedWeeklyTasks,
        weeklyCompletionRate,
        todayCount: todayVisits.length,
        conflictCount: conflictVisits.length,
      },
    },
  });
});
