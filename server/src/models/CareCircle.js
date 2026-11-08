import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['Family Admin', 'Caregiver', 'Viewer'],
      default: 'Caregiver',
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const careCircleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Circle name is required'],
      trim: true,
    },
    careRecipient: {
      name: {
        type: String,
        required: [true, 'Care recipient name is required'],
        trim: true,
      },
      notes: {
        type: String,
        default: '',
        trim: true,
      },
      address: {
        type: String,
        default: '',
        trim: true,
      },
    },
    members: [memberSchema],
  },
  {
    timestamps: true,
  }
);

careCircleSchema.index({ 'members.userId': 1 });

export const CareCircle = mongoose.model('CareCircle', careCircleSchema);
