import { Visit } from '../models/Visit.js';

/**
 * Pure function to check if two time intervals overlap.
 * Rule: StartA < EndB && EndA > StartB
 * Back-to-back intervals (EndA === StartB) DO NOT overlap.
 */
export const doIntervalsOverlap = (startA, endA, startB, endB) => {
  const sA = new Date(startA).getTime();
  const eA = new Date(endA).getTime();
  const sB = new Date(startB).getTime();
  const eB = new Date(endB).getTime();

  return sA < eB && eA > sB;
};

/**
 * Checks for overlapping visits for a care recipient (circle) or caregiver.
 *
 * @param {Object} params
 * @param {string|ObjectId} params.circleId - Care circle ID (same recipient)
 * @param {string|ObjectId} params.caregiverId - Assigned caregiver ID
 * @param {Date|string} params.startTime - Proposed start time
 * @param {Date|string} params.endTime - Proposed end time
 * @param {string|ObjectId} [params.excludeVisitId] - ID of visit being updated (to exclude self)
 * @returns {Promise<{ hasConflict: boolean, conflicts: Array, conflictWith: Array<ObjectId> }>}
 */
export const detectVisitConflicts = async ({
  circleId,
  caregiverId,
  startTime,
  endTime,
  excludeVisitId = null,
}) => {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid start or end time');
  }

  if (start >= end) {
    throw new Error('End time must be after start time');
  }

  // Base query: only active (non-cancelled) visits that overlap using interval formula:
  // existing.startTime < proposedEnd && existing.endTime > proposedStart
  const baseOverlapFilter = {
    status: { $ne: 'Cancelled' },
    startTime: { $lt: end },
    endTime: { $gt: start },
  };

  if (excludeVisitId) {
    baseOverlapFilter._id = { $ne: excludeVisitId };
  }

  // Find recipient conflicts (same circle) OR caregiver double-booking
  const potentialConflicts = await Visit.find({
    ...baseOverlapFilter,
    $or: [
      { circleId: circleId },
      ...(caregiverId ? [{ caregiverId: caregiverId }] : []),
    ],
  })
    .populate('caregiverId', 'name email avatarColor')
    .populate('circleId', 'name careRecipient')
    .lean();

  const conflicts = [];
  const conflictWithIds = new Set();

  for (const visit of potentialConflicts) {
    // Confirm overlap with pure interval function
    if (!doIntervalsOverlap(start, end, visit.startTime, visit.endTime)) {
      continue;
    }

    const isSameCircle = visit.circleId && visit.circleId._id.toString() === circleId.toString();
    const isSameCaregiver =
      caregiverId &&
      visit.caregiverId &&
      visit.caregiverId._id.toString() === caregiverId.toString();

    let conflictType = 'recipient_overlap';
    let message = '';

    const recipientName = visit.circleId?.careRecipient?.name || 'Care Recipient';
    const caregiverName = visit.caregiverId?.name || 'Assigned Caregiver';

    if (isSameCircle && isSameCaregiver) {
      conflictType = 'both';
      message = `Overlaps with "${visit.title}" for ${recipientName} and caregiver ${caregiverName} is double-booked`;
    } else if (isSameCircle) {
      conflictType = 'recipient_overlap';
      message = `Overlaps with another scheduled visit for ${recipientName}: "${visit.title}" (${formatTime(visit.startTime)} - ${formatTime(visit.endTime)})`;
    } else if (isSameCaregiver) {
      conflictType = 'caregiver_double_booked';
      message = `Caregiver ${caregiverName} is already scheduled for "${visit.title}" in another visit (${formatTime(visit.startTime)} - ${formatTime(visit.endTime)})`;
    }

    conflicts.push({
      conflictType,
      message,
      conflictingVisit: {
        _id: visit._id,
        title: visit.title,
        startTime: visit.startTime,
        endTime: visit.endTime,
        status: visit.status,
        caregiver: visit.caregiverId,
        circleName: visit.circleId?.name,
      },
    });

    conflictWithIds.add(visit._id.toString());
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
    conflictWith: Array.from(conflictWithIds),
  };
};

/**
 * Updates bidirectional conflict flags when a visit is created, updated, or cancelled.
 */
export const syncVisitConflicts = async (circleId) => {
  const activeVisits = await Visit.find({
    circleId,
    status: { $ne: 'Cancelled' },
  }).sort({ startTime: 1 });

  for (let i = 0; i < activeVisits.length; i++) {
    const vA = activeVisits[i];
    const conflictingIds = [];

    for (let j = 0; j < activeVisits.length; j++) {
      if (i === j) continue;
      const vB = activeVisits[j];

      const timeOverlaps = doIntervalsOverlap(
        vA.startTime,
        vA.endTime,
        vB.startTime,
        vB.endTime
      );

      if (timeOverlaps) {
        // Overlap in same circle or same caregiver
        const sameCaregiver =
          vA.caregiverId &&
          vB.caregiverId &&
          vA.caregiverId.toString() === vB.caregiverId.toString();

        if (sameCaregiver || true) { // in the same circle, any time overlap is a conflict
          conflictingIds.push(vB._id);
        }
      }
    }

    const hasConflictNow = conflictingIds.length > 0;
    if (vA.hasConflict !== hasConflictNow || vA.conflictWith.length !== conflictingIds.length) {
      vA.hasConflict = hasConflictNow;
      vA.conflictWith = conflictingIds;
      await vA.save();
    }
  }
};

function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
