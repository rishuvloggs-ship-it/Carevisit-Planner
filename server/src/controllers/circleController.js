import bcrypt from 'bcryptjs';
import { CareCircle } from '../models/CareCircle.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { asyncWrapper } from '../middleware/errorHandler.js';

export const createCircle = asyncWrapper(async (req, res) => {
  const { name, careRecipient } = req.body;

  const circle = await CareCircle.create({
    name,
    careRecipient: {
      name: careRecipient.name,
      notes: careRecipient.notes || '',
      address: careRecipient.address || '',
    },
    members: [
      {
        userId: req.user._id,
        role: 'Family Admin',
        joinedAt: new Date(),
      },
    ],
  });

  await ActivityLog.create({
    circleId: circle._id,
    action: 'CIRCLE_CREATED',
    performedBy: req.user._id,
    details: `${req.user.name} created Care Circle "${circle.name}" for ${circle.careRecipient.name}`,
  });

  const populated = await CareCircle.findById(circle._id).populate(
    'members.userId',
    'name email avatarColor'
  );

  res.status(201).json({
    success: true,
    message: 'Care Circle created successfully',
    data: populated,
  });
});

export const getMyCircles = asyncWrapper(async (req, res) => {
  const circles = await CareCircle.find({ 'members.userId': req.user._id })
    .populate('members.userId', 'name email avatarColor')
    .sort({ updatedAt: -1 });

  res.json({
    success: true,
    data: circles,
  });
});

export const getCircleById = asyncWrapper(async (req, res) => {
  // req.circle is already attached and verified by circleAuthMiddleware
  res.json({
    success: true,
    data: {
      ...req.circle.toObject(),
      currentUserRole: req.circleRole,
    },
  });
});

export const updateCircle = asyncWrapper(async (req, res) => {
  const { name, careRecipient } = req.body;
  const circle = req.circle;

  if (name) circle.name = name;
  if (careRecipient) {
    if (careRecipient.name) circle.careRecipient.name = careRecipient.name;
    if (careRecipient.notes !== undefined) circle.careRecipient.notes = careRecipient.notes;
    if (careRecipient.address !== undefined) circle.careRecipient.address = careRecipient.address;
  }

  await circle.save();

  await ActivityLog.create({
    circleId: circle._id,
    action: 'CIRCLE_CREATED',
    performedBy: req.user._id,
    details: `${req.user.name} updated Care Circle details`,
  });

  res.json({
    success: true,
    message: 'Care circle updated successfully',
    data: circle,
  });
});

export const addMember = asyncWrapper(async (req, res) => {
  const { email, role = 'Caregiver' } = req.body;
  const circle = req.circle;

  let targetUser = await User.findOne({ email: email.toLowerCase() });

  // If user doesn't exist yet, create a registered invitation placeholder
  if (!targetUser) {
    const defaultPassword = 'CareVisit2026!';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);
    
    targetUser = await User.create({
      name: email.split('@')[0],
      email: email.toLowerCase(),
      passwordHash,
      avatarColor: '#10B981',
    });
  }

  // Check if already in circle
  const alreadyMember = circle.members.some(
    (m) => (m.userId?._id || m.userId).toString() === targetUser._id.toString()
  );

  if (alreadyMember) {
    return res.status(400).json({
      success: false,
      message: `User with email ${email} is already a member of this Care Circle.`,
    });
  }

  circle.members.push({
    userId: targetUser._id,
    role,
    joinedAt: new Date(),
  });

  await circle.save();

  await ActivityLog.create({
    circleId: circle._id,
    action: 'MEMBER_ADDED',
    performedBy: req.user._id,
    details: `${req.user.name} added ${targetUser.name} (${targetUser.email}) as ${role}`,
  });

  const updatedCircle = await CareCircle.findById(circle._id).populate(
    'members.userId',
    'name email avatarColor'
  );

  res.status(200).json({
    success: true,
    message: `Added ${targetUser.name} to care circle as ${role}`,
    data: updatedCircle,
  });
});

export const removeMember = asyncWrapper(async (req, res) => {
  const { userId } = req.params;
  const circle = req.circle;

  // Cannot remove the only Family Admin
  const adminCount = circle.members.filter((m) => m.role === 'Family Admin').length;
  const targetMember = circle.members.find(
    (m) => (m.userId?._id || m.userId).toString() === userId
  );

  if (!targetMember) {
    return res.status(404).json({
      success: false,
      message: 'Member not found in this circle',
    });
  }

  if (targetMember.role === 'Family Admin' && adminCount <= 1) {
    return res.status(400).json({
      success: false,
      message: 'Cannot remove the only Family Admin in the circle.',
    });
  }

  circle.members = circle.members.filter(
    (m) => (m.userId?._id || m.userId).toString() !== userId
  );

  await circle.save();

  await ActivityLog.create({
    circleId: circle._id,
    action: 'MEMBER_REMOVED',
    performedBy: req.user._id,
    details: `${req.user.name} removed member from the circle`,
  });

  res.json({
    success: true,
    message: 'Member removed from care circle',
    data: circle,
  });
});
