import mongoose, { Document, Schema } from 'mongoose';

export interface IAchievement extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'streak' | 'logs_count' | 'conversation' | 'food_tracking' | 'exercise' | 'weight_goal' | 'custom';
  title: string;
  description: string;
  icon: string;
  experiencePoints: number;
  requirement: {
    target: number;
    current: number;
    unit: string; // 'days', 'logs', 'conversations', 'photos', etc.
  };
  isCompleted: boolean;
  completedAt?: Date;
  category: 'health' | 'social' | 'progress' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  metadata?: {
    relatedLogTypes?: string[];
    consecutiveDays?: number;
    targetValue?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const achievementSchema = new Schema<IAchievement>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['streak', 'logs_count', 'conversation', 'food_tracking', 'exercise', 'weight_goal', 'custom'],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  icon: {
    type: String,
    required: true,
    trim: true
  },
  experiencePoints: {
    type: Number,
    required: true,
    min: 0,
    max: 1000
  },
  requirement: {
    target: {
      type: Number,
      required: true,
      min: 1
    },
    current: {
      type: Number,
      default: 0,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      trim: true
    }
  },
  isCompleted: {
    type: Boolean,
    default: false,
    index: true
  },
  completedAt: {
    type: Date
  },
  category: {
    type: String,
    enum: ['health', 'social', 'progress', 'milestone'],
    required: true,
    index: true
  },
  rarity: {
    type: String,
    enum: ['common', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  metadata: {
    relatedLogTypes: [{
      type: String,
      trim: true
    }],
    consecutiveDays: {
      type: Number,
      min: 0
    },
    targetValue: {
      type: Number
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
achievementSchema.index({ userId: 1, isCompleted: 1 });
achievementSchema.index({ userId: 1, type: 1 });
achievementSchema.index({ userId: 1, category: 1 });
achievementSchema.index({ completedAt: -1 });

export default mongoose.model<IAchievement>('Achievement', achievementSchema);