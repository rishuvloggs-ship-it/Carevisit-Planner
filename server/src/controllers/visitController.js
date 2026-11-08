import { Visit } from '../models/Visit.js';
import { Task } from '../models/Task.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { asyncWrapper } from '../middleware/errorHandler.js';
import { detectVisitConflicts, syncVisitConflicts } from '../services/conflictService.js';

export const checkConflictsEndpoint = asyncWrapper(async (req, res) => {
  const { circleId, caregiverId, startTime, endTime, excludeVisitId } = req.body;

  const result = await detectVisitConflicts({
    circleId,
    caregiverId,
    startTime,
    endTime,
    excludeVisitId,
  });

  res.json({
    success: true,
    data: result,
  });
});

export const getCircleVisits = asyncWrapper(async (req, res) => {
  const { circleId } = req.params;
  const { start, end, caregiverId, status } = req.query;

  const filter = { circleId };

  if (start && end) {
    filter.startTime = { $gte: new Date(start), $lte: new Date(end) };
  } else if (start) {
    filter.startTime = { $gte: new Date(start) };
  }

  if (caregiverId) {
    filter.caregiverId = caregiverId;
  }

  if (status) {
    filter.status = status;
  }

  const visits = await Visit.find(filter)
    .populate('caregiverId', 'name email avatarColor phone')
    .populate('conflictWith', 'title startTime endTime status')
    .sort({ startTime: 1 })
    .lean();

  // Attach task stats to each visit
  const visitIds = visits.map((v) => v._id);
  const tasks = await Task.find({ visitId: { $in: visitIds } }).lean();

  const taskMap = {};
  for (const t of tasks) {
    const vId = t.visitId.toString();
    if (!taskMap[vId]) taskMap[vId] = [];
    taskMap[vId].push(t);
  }

  const enhancedVisits = visits.map((v) => {
    const vTasks = taskMap[v._id.toString()] || [];
    const completedTasks = vTasks.filter((t) => t.isCompleted).length;
    return {
      ...v,
      tasks: vTasks,
      taskCount: vTasks.length,
      completedTaskCount: completedTasks,
    };
  });

  res.json({
    success: true,
    data: enhancedVisits,
  });
});

export const getVisitById = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const visit = await Visit.findById(id)
    .populate('caregiverId', 'name email avatarColor phone')
    .populate('conflictWith', 'title startTime endTime caregiverId status')
    .populate('circleId', 'name careRecipient');

  if (!visit) {
    return res.status(404).json({
      success: false,
      message: 'Visit not found',
    });
  }

  const tasks = await Task.find({ visitId: visit._id })
    .populate('completedBy', 'name email avatarColor')
    .sort({ createdAt: 1 });

  res.json({
    success: true,
    data: {
      ...visit.toObject(),
      tasks,
    },
  });
});

export const createVisit = asyncWrapper(async (req, res) => {
  const circleId = req.params.circleId || req.body.circleId;
  const {
    caregiverId,
    title,
    category,
    startTime,
    endTime,
    location,
    notes,
    saveAnyway = false,
    recurrence = { frequency: 'none' },
    tasks = [],
  } = req.body;

  // Run conflict detection
  const conflictResult = await detectVisitConflicts({
    circleId,
    caregiverId,
    startTime,
    endTime,
  });

  // If conflict exists and user has NOT confirmed save anyway:
  if (conflictResult.hasConflict && !saveAnyway) {
    return res.status(409).json({
      success: false,
      hasConflict: true,
      message: 'Schedule conflict detected. Please adjust time or confirm to save anyway.',
      data: conflictResult,
    });
  }

  // Create primary visit
  const visit = await Visit.create({
    circleId,
    caregiverId,
    title,
    category: category || 'General Check-in',
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    location: location || 'Home',
    notes: notes || '',
    status: 'Scheduled',
    hasConflict: conflictResult.hasConflict,
    conflictWith: conflictResult.conflictWith,
    recurrence: {
      frequency: recurrence?.frequency || 'none',
      until: recurrence?.until ? new Date(recurrence.until) : null,
    },
  });

  // Create associated tasks if provided
  if (tasks && tasks.length > 0) {
    const taskDocs = tasks.map((desc) => ({
      visitId: visit._id,
      circleId,
      description: typeof desc === 'string' ? desc.trim() : desc.description?.trim(),
      isCompleted: false,
    })).filter((t) => t.description);

    if (taskDocs.length > 0) {
      await Task.insertMany(taskDocs);
    }
  }

  // Handle optional recurrence generation (up to 4 weeks max)
  const createdRecurringVisits = [];
  if (recurrence && recurrence.frequency && recurrence.frequency !== 'none' && recurrence.until) {
    const freq = recurrence.frequency;
    const untilDate = new Date(recurrence.until);
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    let nextStart = new Date(startTime);

    let safetyLimit = 0;
    while (safetyLimit < 28) {
      safetyLimit++;
      if (freq === 'daily') {
        nextStart = new Date(nextStart.getTime() + 24 * 60 * 60 * 1000);
      } else if (freq === 'weekly') {
        nextStart = new Date(nextStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      if (nextStart > untilDate) break;

      const nextEnd = new Date(nextStart.getTime() + durationMs);
      const recConflict = await detectVisitConflicts({
        circleId,
        caregiverId,
        startTime: nextStart,
        endTime: nextEnd,
      });

      const recVisit = await Visit.create({
        circleId,
        caregiverId,
        title: `${title} (Recurring)`,
        category: category || 'General Check-in',
        startTime: nextStart,
        endTime: nextEnd,
        location: location || 'Home',
        notes: notes || '',
        status: 'Scheduled',
        hasConflict: recConflict.hasConflict,
        conflictWith: recConflict.conflictWith,
        recurrence: { frequency: 'none', until: null },
      });

      if (tasks && tasks.length > 0) {
        const recTasks = tasks.map((desc) => ({
          visitId: recVisit._id,
          circleId,
          description: typeof desc === 'string' ? desc.trim() : desc.description?.trim(),
        })).filter((t) => t.description);
        await Task.insertMany(recTasks);
      }

      createdRecurringVisits.push(recVisit);
    }
  }

  // Sync bidirectional conflicts for the circle
  await syncVisitConflicts(circleId);

  // Log activity
  await ActivityLog.create({
    circleId,
    action: conflictResult.hasConflict ? 'CONFLICT_FLAGGED' : 'VISIT_CREATED',
    performedBy: req.user._id,
    details: `${req.user.name} scheduled visit "${visit.title}" (${new Date(visit.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})${conflictResult.hasConflict ? ' [Saved with conflict warning]' : ''}`,
  });

  const populated = await Visit.findById(visit._id)
    .populate('caregiverId', 'name email avatarColor phone')
    .populate('conflictWith', 'title startTime endTime');

  const createdTasks = await Task.find({ visitId: visit._id });

  res.status(201).json({
    success: true,
    message: conflictResult.hasConflict
      ? 'Visit saved with conflict flag.'
      : 'Visit scheduled successfully.',
    data: {
      ...populated.toObject(),
      tasks: createdTasks,
      recurringCount: createdRecurringVisits.length,
    },
  });
});

export const updateVisit = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const {
    caregiverId,
    title,
    category,
    startTime,
    endTime,
    location,
    notes,
    status,
    completedNotes,
    saveAnyway = false,
  } = req.body;

  const visit = await Visit.findById(id);
  if (!visit) {
    return res.status(404).json({
      success: false,
      message: 'Visit not found',
    });
  }

  const newStart = startTime ? new Date(startTime) : visit.startTime;
  const newEnd = endTime ? new Date(endTime) : visit.endTime;
  const newCaregiver = caregiverId || visit.caregiverId;

  // Check conflicts with updated parameters
  const conflictResult = await detectVisitConflicts({
    circleId: visit.circleId,
    caregiverId: newCaregiver,
    startTime: newStart,
    endTime: newEnd,
    excludeVisitId: visit._id,
  });

  if (conflictResult.hasConflict && !saveAnyway) {
    return res.status(409).json({
      success: false,
      hasConflict: true,
      message: 'Updated time causes a scheduling conflict. Please adjust time or confirm to save anyway.',
      data: conflictResult,
    });
  }

  if (caregiverId) visit.caregiverId = caregiverId;
  if (title) visit.title = title;
  if (category) visit.category = category;
  visit.startTime = newStart;
  visit.endTime = newEnd;
  if (location !== undefined) visit.location = location;
  if (notes !== undefined) visit.notes = notes;
  if (status) visit.status = status;
  if (completedNotes !== undefined) visit.completedNotes = completedNotes;

  visit.hasConflict = conflictResult.hasConflict;
  visit.conflictWith = conflictResult.conflictWith;

  await visit.save();

  // Re-sync all conflicts in this circle
  await syncVisitConflicts(visit.circleId);

  // Log activity
  await ActivityLog.create({
    circleId: visit.circleId,
    action: 'VISIT_UPDATED',
    performedBy: req.user._id,
    details: `${req.user.name} updated visit "${visit.title}" (status: ${visit.status})`,
  });

  const updated = await Visit.findById(visit._id)
    .populate('caregiverId', 'name email avatarColor phone')
    .populate('conflictWith', 'title startTime endTime');

  const tasks = await Task.find({ visitId: visit._id }).populate('completedBy', 'name');

  res.json({
    success: true,
    message: 'Visit updated successfully',
    data: {
      ...updated.toObject(),
      tasks,
    },
  });
});

export const deleteVisit = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const visit = await Visit.findById(id);
  if (!visit) {
    return res.status(404).json({
      success: false,
      message: 'Visit not found',
    });
  }

  const circleId = visit.circleId;
  const title = visit.title;

  await Task.deleteMany({ visitId: visit._id });
  await visit.deleteOne();

  await syncVisitConflicts(circleId);

  await ActivityLog.create({
    circleId,
    action: 'VISIT_DELETED',
    performedBy: req.user._id,
    details: `${req.user.name} deleted visit "${title}"`,
  });

  res.json({
    success: true,
    message: 'Visit and associated tasks deleted',
  });
});
