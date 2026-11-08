import mongoose from 'mongoose';
import { CareCircle } from '../models/CareCircle.js';
import { Visit } from '../models/Visit.js';

export const circleAuthMiddleware = async (req, res, next) => {
  try {
    let circleId =
      req.params.circleId ||
      req.params.id ||
      req.body.circleId ||
      req.query.circleId;

    // If request has visitId instead, find visit's circle
    if (!circleId && (req.params.visitId || (req.baseUrl.includes('visits') && req.params.id))) {
      const vId = req.params.visitId || req.params.id;
      if (mongoose.Types.ObjectId.isValid(vId)) {
        const visit = await Visit.findById(vId).select('circleId');
        if (visit) {
          circleId = visit.circleId;
        }
      }
    }

    if (!circleId || !mongoose.Types.ObjectId.isValid(circleId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid Care Circle ID is required for this operation.',
      });
    }

    const circle = await CareCircle.findById(circleId).populate('members.userId', 'name email avatarColor');
    if (!circle) {
      return res.status(404).json({
        success: false,
        message: 'Care Circle not found.',
      });
    }

    // Check if authenticated user is a member of this circle
    const member = circle.members.find(
      (m) => m.userId && (m.userId._id || m.userId).toString() === req.user._id.toString()
    );

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not an authorised member of this Care Circle.',
      });
    }

    req.circle = circle;
    req.circleRole = member.role; // 'Family Admin' | 'Caregiver' | 'Viewer'
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role-based guard within a circle.
 * @param {string[]} allowedRoles
 */
export const requireCircleRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.circleRole || !allowedRoles.includes(req.circleRole)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied: This action requires one of the following roles: [${allowedRoles.join(
          ', '
        )}]. Your current role is "${req.circleRole}".`,
      });
    }
    next();
  };
};
