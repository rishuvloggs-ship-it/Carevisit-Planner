import mongoose from 'mongoose';

const recurrenceSchema = new mongoose.Schema(
  {
    frequency: {
      type: String,
      enum: ['none', 'daily', 'weekly'],
      default: 'none',
    },
    until: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const visitSchema = new mongoose.Schema(
  {
    circleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CareCircle',
      required: true,
      index: true,
    },
    caregiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Visit title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Companionship',
        'Grocery & Meals',
        'Medication Reminder',
        'Light Household Help',
        'Transport & Appointments',
        'Personal Care',
        'General Check-in',
      ],
      default: 'General Check-in',
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
      index: true,
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      index: true,
    },
    location: {
      type: String,
      default: 'Home',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Missed', 'Cancelled'],
      default: 'Scheduled',
      index: true,
    },
    hasConflict: {
      type: Boolean,
      default: false,
      index: true,
    },
    conflictWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visit',
      },
    ],
    recurrence: {
      type: recurrenceSchema,
      default: () => ({ frequency: 'none', until: null }),
    },
    completedNotes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient conflict and calendar range lookups
visitSchema.index({ circleId: 1, startTime: 1, endTime: 1 });
visitSchema.index({ caregiverId: 1, startTime: 1, endTime: 1 });

export const Visit = mongoose.model('Visit', visitSchema);
