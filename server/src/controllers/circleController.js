import bcrypt from 'bcryptjs';
import { CareCircle } from '../models/CareCircle.js';
import { User } from '../models/User.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { isDBConnected } from '../config/db.js';
import { mockStore } from '../services/mockDataService.js';
import { asyncWrapper } from '../middleware/errorHandler.js';

export const createCircle = asyncWrapper(async (req, res) => {
  const { name, careRecipient } = req.body;

  if (isDBConnected()) {
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

    const populated = await CareCircle.findById(circle._id).populate(
      'members.userId',
      'name email avatarColor'
    );

    return res.status(201).json({
      success: true,
      message: 'Care Circle created successfully',
      data: populated,
    });
  }

  mockStore.careCircle.name = name;
  mockStore.careCircle.careRecipient = careRecipient;
  res.status(201).json({
    success: true,
    message: 'Care Circle created successfully',
    data: mockStore.careCircle,
  });
});

export const getMyCircles = asyncWrapper(async (req, res) => {
  if (isDBConnected()) {
    const circles = await CareCircle.find({ 'members.userId': req.user._id })
      .populate('members.userId', 'name email avatarColor')
      .sort({ updatedAt: -1 });

    return res.json({ success: true, data: circles });
  }

  res.json({ success: true, data: [mockStore.careCircle] });
});

export const getCircleById = asyncWrapper(async (req, res) => {
  if (isDBConnected()) {
    return res.json({
      success: true,
      data: {
        ...req.circle.toObject(),
        currentUserRole: req.circleRole,
      },
    });
  }

  res.json({
    success: true,
    data: {
      ...mockStore.careCircle,
      currentUserRole: req.circleRole || 'Family Admin',
    },
  });
});

export const updateCircle = asyncWrapper(async (req, res) => {
  const { name, careRecipient } = req.body;

  if (isDBConnected()) {
    const circle = req.circle;
    if (name) circle.name = name;
    if (careRecipient) {
      if (careRecipient.name) circle.careRecipient.name = careRecipient.name;
      if (careRecipient.notes !== undefined) circle.careRecipient.notes = careRecipient.notes;
      if (careRecipient.address !== undefined) circle.careRecipient.address = careRecipient.address;
    }
    await circle.save();
    return res.json({ success: true, data: circle });
  }

  if (name) mockStore.careCircle.name = name;
  if (careRecipient) Object.assign(mockStore.careCircle.careRecipient, careRecipient);
  res.json({ success: true, data: mockStore.careCircle });
});

export const addMember = asyncWrapper(async (req, res) => {
  const { email, role = 'Caregiver' } = req.body;

  if (isDBConnected()) {
    const circle = req.circle;
    let targetUser = await User.findOne({ email: email.toLowerCase() });
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

    circle.members.push({ userId: targetUser._id, role, joinedAt: new Date() });
    await circle.save();

    const updatedCircle = await CareCircle.findById(circle._id).populate(
      'members.userId',
      'name email avatarColor'
    );
    return res.json({ success: true, message: `Added ${targetUser.name}`, data: updatedCircle });
  }

  const newMember = {
    userId: { _id: 'u_' + Date.now(), name: email.split('@')[0], email, avatarColor: '#10B981' },
    role,
    joinedAt: new Date(),
  };
  mockStore.careCircle.members.push(newMember);
  res.json({ success: true, message: `Added ${email}`, data: mockStore.careCircle });
});

export const removeMember = asyncWrapper(async (req, res) => {
  const { userId } = req.params;

  if (isDBConnected()) {
    const circle = req.circle;
    circle.members = circle.members.filter((m) => (m.userId?._id || m.userId).toString() !== userId);
    await circle.save();
    return res.json({ success: true, message: 'Member removed', data: circle });
  }

  mockStore.careCircle.members = mockStore.careCircle.members.filter(
    (m) => (m.userId?._id || m.userId).toString() !== userId
  );
  res.json({ success: true, message: 'Member removed', data: mockStore.careCircle });
});
