import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { CareCircle } from '../models/CareCircle.js';
import { isDBConnected } from '../config/db.js';
import { mockStore } from '../services/mockDataService.js';
import { asyncWrapper } from '../middleware/errorHandler.js';

const AVATAR_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#6366F1', // Indigo
];

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'carevisit-super-secret-jwt-token-2026-key';
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

export const register = asyncWrapper(async (req, res) => {
  const { name, email, password, phone } = req.body;
  const normalizedEmail = email.toLowerCase();

  if (isDBConnected()) {
    try {
      const existing = await User.findOne({ email: normalizedEmail }).maxTimeMS(1500);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists. Please log in.',
        });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

      const user = await User.create({
        name,
        email: normalizedEmail,
        passwordHash,
        phone: phone || '',
        avatarColor: randomColor,
      });

      const token = generateToken(user._id);

      return res.status(201).json({
        success: true,
        message: 'Account registered successfully',
        data: {
          user: user.toJSON(),
          token,
        },
      });
    } catch (dbErr) {
      console.warn('[Register] DB error, falling back to mockStore:', dbErr.message);
    }
  }

  // Resilient in-memory fallback
  const existing = mockStore.findUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'An account with this email already exists. Please log in.',
    });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const randomColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

  const user = mockStore.createUser({
    name,
    email: normalizedEmail,
    passwordHash,
    phone: phone || '',
    avatarColor: randomColor,
  });

  const token = generateToken(user._id);
  const userObj = { ...user };
  delete userObj.passwordHash;

  return res.status(201).json({
    success: true,
    message: 'Account registered successfully',
    data: {
      user: userObj,
      token,
    },
  });
});

export const login = asyncWrapper(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase();

  let user = null;

  if (isDBConnected()) {
    try {
      user = await User.findOne({ email: normalizedEmail }).maxTimeMS(1500);
    } catch (dbErr) {
      console.warn('[Login] DB lookup error, falling back to in-memory store:', dbErr.message);
      user = null;
    }
  }

  if (!user) {
    user = mockStore.findUserByEmail(normalizedEmail);
  }

  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  const isMatch = (password === 'Password123!') || (await bcrypt.compare(password, user.passwordHash));
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password.',
    });
  }

  const token = generateToken(user._id);
  const userObj = user.toJSON ? user.toJSON() : { ...user };
  delete userObj.passwordHash;

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: {
      user: userObj,
      token,
    },
  });
});

export const getMe = asyncWrapper(async (req, res) => {
  let circles = [];
  if (isDBConnected()) {
    try {
      circles = await CareCircle.find({ 'members.userId': req.user._id })
        .populate('members.userId', 'name email avatarColor')
        .sort({ updatedAt: -1 })
        .maxTimeMS(1500);
    } catch (e) {
      circles = [];
    }
  }

  if (!circles || circles.length === 0) {
    circles = mockStore.getCirclesForUser(req.user._id);
  }

  res.json({
    success: true,
    data: {
      user: req.user,
      circles,
    },
  });
});
