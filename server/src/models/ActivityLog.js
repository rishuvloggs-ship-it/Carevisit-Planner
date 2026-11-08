import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
  {
    circleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CareCircle',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CIRCLE_CREATED',
        'MEMBER_ADDED',
        'MEMBER_REMOVED',
        'VISIT_CREATED',
        'VISIT_UPDATED',
        'VISIT_CANCELLED',
        'VISIT_DELETED',
        'CONFLICT_FLAGGED',
        'CONFLICT_RESOLVED',
        'TASK_CREATED',
        'TASK_COMPLETED',
        'TASK_UNCOMPLETED',
        'AI_SUMMARY_GENERATED',
      ],
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    details: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
