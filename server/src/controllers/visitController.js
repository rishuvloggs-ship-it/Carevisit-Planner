import { Visit } from '../models/Visit.js';
import { Task } from '../models/Task.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { isDBConnected } from '../config/db.js';
import { mockStore } from '../services/mockDataService.js';
import { asyncWrapper } from '../middleware/errorHandler.js';
import { detectVisitConflicts, syncVisitConflicts, doIntervalsOverlap } from '../services/conflictService.js';

export const checkConflictsEndpoint = asyncWrapper(async (req, res) => {
  const { circleId, caregiverId, startTime, endTime, excludeVisitId } = req.body;

  if (isDBConnected()) {
    const result = await detectVisitConflicts({
      circleId,
      caregiverId,
      startTime,
      endTime,
      excludeVisitId,
    });
    return res.json({ success: true, data: result });
  }

  // Fallback in-memory conflict check
  const start = new Date(startTime).getTime();
  const end = new Date(endTime).getTime();
  const activeVisits = mockStore.getVisits(circleId).filter((v) => v.status !== 'Cancelled');
  
  const conflicts = [];
  const conflictWithIds = [];

  for (const v of activeVisits) {
    if (excludeVisitId && v._id.toString() === excludeVisitId.toString()) continue;
    const vStart = new Date(v.startTime).getTime();
    const vEnd = new Date(v.endTime).getTime();

    if (start < vEnd && end > vStart) {
      conflicts.push({
        conflictType: 'recipient_overlap',
        message: `Overlaps with scheduled visit: "${v.title}" (${new Date(v.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(v.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
        conflictingVisit: v,
      });
      conflictWithIds.push(v._id);
    }
  }

  res.json({
    success: true,
    data: {
      hasConflict: conflicts.length > 0,
      conflicts,
      conflictWith: conflictWithIds,
    },
  });
});

export const getCircleVisits = asyncWrapper(async (req, res) => {
  const { circleId } = req.params;
  const { start, end, caregiverId, status } = req.query;

  if (isDBConnected()) {
    const filter = { circleId };
    if (start && end) {
      filter.startTime = { $gte: new Date(start), $lte: new Date(end) };
    } else if (start) {
      filter.startTime = { $gte: new Date(start) };
    }
    if (caregiverId) filter.caregiverId = caregiverId;
    if (status) filter.status = status;

    const visits = await Visit.find(filter)
      .populate('caregiverId', 'name email avatarColor phone')
      .populate('conflictWith', 'title startTime endTime status')
      .sort({ startTime: 1 })
      .lean();

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

    return res.json({ success: true, data: enhancedVisits });
  }

  // Fallback in-memory
  const mockVisits = mockStore.getVisits(circleId, { caregiverId, status });
  const enhanced = mockVisits.map((v) => {
    const vTasks = mockStore.getTasksForVisit(v._id);
    const completedTasks = vTasks.filter((t) => t.isCompleted).length;
    return {
      ...v,
      tasks: vTasks,
      taskCount: vTasks.length,
      completedTaskCount: completedTasks,
    };
  });

  res.json({ success: true, data: enhanced });
});

export const getVisitById = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  if (isDBConnected()) {
    const visit = await Visit.findById(id)
      .populate('caregiverId', 'name email avatarColor phone')
      .populate('conflictWith', 'title startTime endTime caregiverId status')
      .populate('circleId', 'name careRecipient');

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    const tasks = await Task.find({ visitId: visit._id })
      .populate('completedBy', 'name email avatarColor')
      .sort({ createdAt: 1 });

    return res.json({
      success: true,
      data: {
        ...visit.toObject(),
        tasks,
      },
    });
  }

  const visit = mockStore.getVisitById(id);
  if (!visit) {
    return res.status(404).json({ success: false, message: 'Visit not found' });
  }

  res.json({ success: true, data: visit });
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

  if (isDBConnected()) {
    const conflictResult = await detectVisitConflicts({
      circleId,
      caregiverId,
      startTime,
      endTime,
    });

    if (conflictResult.hasConflict && !saveAnyway) {
      return res.status(409).json({
        success: false,
        hasConflict: true,
        message: 'Schedule conflict detected. Please adjust time or confirm to save anyway.',
        data: conflictResult,
      });
    }

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

    if (tasks && tasks.length > 0) {
      const taskDocs = tasks.map((desc) => ({
        visitId: visit._id,
        circleId,
        description: typeof desc === 'string' ? desc.trim() : desc.description?.trim(),
        isCompleted: false,
      })).filter((t) => t.description);
      if (taskDocs.length > 0) await Task.insertMany(taskDocs);
    }

    await syncVisitConflicts(circleId);

    const populated = await Visit.findById(visit._id)
      .populate('caregiverId', 'name email avatarColor phone')
      .populate('conflictWith', 'title startTime endTime');
    const createdTasks = await Task.find({ visitId: visit._id });

    return res.status(201).json({
      success: true,
      message: 'Visit scheduled successfully.',
      data: {
        ...populated.toObject(),
        tasks: createdTasks,
      },
    });
  }

  // In-memory fallback create
  const newV = mockStore.createVisit({
    circleId,
    caregiverId,
    title,
    category: category || 'General Check-in',
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    location: location || 'Home',
    notes: notes || '',
    status: 'Scheduled',
    hasConflict: false,
    conflictWith: [],
  });

  if (tasks && tasks.length > 0) {
    tasks.forEach((desc) => {
      mockStore.addTask({
        visitId: newV._id,
        circleId,
        description: typeof desc === 'string' ? desc.trim() : desc.description?.trim(),
      });
    });
  }

  res.status(201).json({
    success: true,
    message: 'Visit scheduled successfully.',
    data: newV,
  });
});

export const updateVisit = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  if (isDBConnected()) {
    const visit = await Visit.findById(id);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });

    Object.assign(visit, updateFields);
    await visit.save();
    return res.json({ success: true, message: 'Visit updated', data: visit });
  }

  const updated = mockStore.updateVisit(id, updateFields);
  res.json({ success: true, message: 'Visit updated', data: updated });
});

export const deleteVisit = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  if (isDBConnected()) {
    const visit = await Visit.findById(id);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });
    await Task.deleteMany({ visitId: visit._id });
    await visit.deleteOne();
    return res.json({ success: true, message: 'Visit deleted' });
  }

  mockStore.deleteVisit(id);
  res.json({ success: true, message: 'Visit deleted' });
});
