import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { isDBConnected } from '../config/db.js';
import { mockStore } from '../services/mockDataService.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'carevisit-super-secret-jwt-token-2026-key';

    const decoded = jwt.verify(token, secret);
    let user = null;

    if (isDBConnected()) {
      try {
        user = await User.findById(decoded.userId).select('-passwordHash').maxTimeMS(1500);
      } catch (e) {
        user = null;
      }
    }

    if (!user) {
      user = mockStore.findUserById(decoded.userId);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User no longer exists.',
      });
    }

    const userObj = user.toJSON ? user.toJSON() : { ...user };
    delete userObj.passwordHash;
    req.user = userObj;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Invalid or malformed authentication token.',
    });
  }
};
