import mongoose, { Document, Schema } from 'mongoose';
import { 
  HealthLogType, 
  HealthLogDataUnion,
  WeightLogData,
  MoodLogData,
  SleepLogData,
  WaterLogData,
  FoodLogData,
  ExerciseLogData,
  MedicationLogData,
  OtherLogData
} from '../../shared/types/health';

export interface IHealthLog extends Document {
  userId: mongoose.Types.ObjectId;
  type: HealthLogType;
  title: string;
  description?: string;
  data: HealthLogDataUnion;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const healthLogSchema = new Schema<IHealthLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['food', 'exercise', 'water', 'weight', 'medication', 'mood', 'sleep', 'other'] as HealthLogType[],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  data: {
    type: Schema.Types.Mixed,
    default: {}
  },
  date: {
    type: Date,
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
healthLogSchema.index({ userId: 1, date: -1 });
healthLogSchema.index({ userId: 1, type: 1, date: -1 });

const HealthLog = mongoose.model<IHealthLog>('HealthLog', healthLogSchema);

export default HealthLog;