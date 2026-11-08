import { Task } from '../models/Task.js';
import { Visit } from '../models/Visit.js';
import { isDBConnected } from '../config/db.js';
import { mockStore } from '../services/mockDataService.js';
import { asyncWrapper } from '../middleware/errorHandler.js';

export const addTaskToVisit = asyncWrapper(async (req, res) => {
  const { id: visitId } = req.params;
  const { description, notes } = req.body;

  if (isDBConnected()) {
    const visit = await Visit.findById(visitId);
    if (!visit) return res.status(404).json({ success: false, message: 'Visit not found' });

    const task = await Task.create({
      visitId,
      circleId: visit.circleId,
      description,
      notes: notes || '',
      isCompleted: false,
    });

    return res.status(201).json({ success: true, data: task });
  }

  const task = mockStore.addTask({
    visitId,
    circleId: '6af0510d2b5c98b502cf1396',
    description,
    notes: notes || '',
  });

  res.status(201).json({ success: true, data: task });
});

export const toggleCompleteTask = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  const { isCompleted } = req.body;

  if (isDBConnected()) {
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const targetCompleted = isCompleted !== undefined ? isCompleted : !task.isCompleted;
    task.isCompleted = targetCompleted;
    task.completedAt = targetCompleted ? new Date() : null;
    task.completedBy = targetCompleted ? req.user._id : null;
    await task.save();

    const updated = await Task.findById(task._id).populate('completedBy', 'name email avatarColor');
    return res.json({ success: true, data: updated });
  }

  const task = mockStore.toggleTask(id, isCompleted !== undefined ? isCompleted : true, req.user);
  res.json({ success: true, data: task });
});

export const deleteTask = asyncWrapper(async (req, res) => {
  const { id } = req.params;
  if (isDBConnected()) {
    const task = await Task.findById(id);
    if (task) await task.deleteOne();
    return res.json({ success: true, message: 'Task deleted' });
  }

  mockStore.deleteTask(id);
  res.json({ success: true, message: 'Task deleted' });
});
