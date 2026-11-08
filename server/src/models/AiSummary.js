import mongoose from 'mongoose';

const aiSummarySchema = new mongoose.Schema(
  {
    circleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CareCircle',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['weekly_summary', 'handover_note'],
      default: 'weekly_summary',
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

aiSummarySchema.index({ circleId: 1, type: 1, generatedAt: -1 });

export const AiSummary = mongoose.model('AiSummary', aiSummarySchema);
