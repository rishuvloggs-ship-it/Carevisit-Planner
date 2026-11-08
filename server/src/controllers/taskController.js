import { Task } from '../models/Task.js';
import { Visit } from '../models/Visit.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { asyncWrapper } from '../middleware/errorHandler.js';

export const addTaskToVisit = asyncWrapper(async (req, res) => {
  const { id: visitId } = req.params;
  const { description, notes } = req.body;

  const visit = await Visit.findById(visitId);
  if (!visit) {
    return res.status(404).json({
      success: false,
      message: 'Visit not found',
    });
  }

  const task = await Task.create({
    visitId,
    circleId: visit.circleId,
    description,
    notes: notes || '',
    isCompleted: false,
  });

  await ActivityLog.create({
    circleId: visit.circleId,
    action: 'TASK_CREATED',
    performedBy: req.user._id,
    details: `${req.user.name} added task "${description}" to visit "${visit.title}"`,
  });

  res.status(201).json({
    success: true,
    message: 'Task added successfully',
    data: task,
  });
});

export const toggleCompleteTask = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { isCompleted } = req.body;

  const task = await Task.findById(id).populate('visitId', 'title circleId');
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  const targetCompleted = isCompleted !== undefined ? isCompleted : !task.isCompleted;

  task.isCompleted = targetCompleted;
  if (targetCompleted) {
    task.completedAt = new Date();
    task.completedBy = req.user._id;
  } else {
    task.completedAt = null;
    task.completedBy = null;
  }

  await task.save();

  await ActivityLog.create({
    circleId: task.circleId,
    action: targetCompleted ? 'TASK_COMPLETED' : 'TASK_UNCOMPLETED',
    performedBy: req.user._id,
    details: `${req.user.name} ${targetCompleted ? 'completed' : 'unmarked'} task "${task.description}"`,
  });

  const updated = await Task.findById(task._id).populate('completedBy', 'name email avatarColor');

  res.json({
    success: true,
    message: targetCompleted ? 'Task marked as completed' : 'Task marked as pending',
    data: updated,
  });
});

export const deleteTask = asyncWrapper(async (req, res) => {
  const { id } = req.params;

  const task = await Task.findById(id);
  if (!task) {
    return res.status(404).json({
      success: false,
      message: 'Task not found',
    });
  }

  await task.deleteOne();

  res.json({
    success: true,
    message: 'Task deleted',
  });
});
