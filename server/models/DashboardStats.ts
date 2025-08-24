import mongoose, { Document, Schema } from 'mongoose';

export interface IDashboardStats extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: Date; // The date these stats are for (daily stats)
  
  // Health metrics
  healthLevel: number; // 0-100
  totalHealthLogs: number;
  dailyHealthLogs: number;
  
  // Streak and consistency
  currentStreak: number;
  longestStreak: number;
  consistencyScore: number; // 0-100
  
  // Calorie tracking
  dailyCalories: number;
  calorieGoal: number;
  calorieProgress: number; // percentage
  
  // Weight tracking
  currentWeight?: number;
  weightGoal?: number;
  weightChange7Days?: number;
  weightChange30Days?: number;
  
  // Exercise and activity
  exerciseMinutes: number;
  exerciseGoal: number;
  dailySteps: number; // number of steps taken today
  stepsGoal: number; // daily steps goal
  waterIntake: number; // in glasses/liters
  waterGoal: number;
  
  // Sleep tracking
  sleepHours?: number;
  sleepGoal: number;
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  
  // Mood and mental health
  currentMood: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious';
  moodScore: number; // 1-10
  stressLevel: number; // 1-10
  
  // Character progression
  characterLevel: number;
  experiencePoints: number; // Experience within current level (0-99)
  experienceToNextLevel: number;
  totalExperiencePoints: number; // Total accumulated experience
  
  // Achievement progress
  newAchievements: number; // count of new achievements today
  totalAchievements: number;
  
  // Social and engagement
  conversationMessages: number;
  foodPhotos: number;
  
  createdAt: Date;
  updatedAt: Date;
}

const dashboardStatsSchema = new Schema<IDashboardStats>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Health metrics
  healthLevel: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 50
  },
  totalHealthLogs: {
    type: Number,
    default: 0,
    min: 0
  },
  dailyHealthLogs: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Streak and consistency
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  consistencyScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Calorie tracking
  dailyCalories: {
    type: Number,
    default: 0,
    min: 0
  },
  calorieGoal: {
    type: Number,
    default: 2000,
    min: 800,
    max: 5000
  },
  calorieProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 200 // Allow up to 200% for overeating tracking
  },
  
  // Weight tracking
  currentWeight: {
    type: Number,
    min: 20,
    max: 300
  },
  weightGoal: {
    type: Number,
    min: 20,
    max: 300
  },
  weightChange7Days: {
    type: Number
  },
  weightChange30Days: {
    type: Number
  },
  
  // Exercise and activity
  exerciseMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  exerciseGoal: {
    type: Number,
    default: 30,
    min: 0
  },
  dailySteps: {
    type: Number,
    default: 0,
    min: 0
  },
  stepsGoal: {
    type: Number,
    default: 10000,
    min: 0
  },
  waterIntake: {
    type: Number,
    default: 0,
    min: 0
  },
  waterGoal: {
    type: Number,
    default: 8,
    min: 1
  },
  
  // Sleep tracking
  sleepHours: {
    type: Number,
    min: 0,
    max: 24
  },
  sleepGoal: {
    type: Number,
    default: 8,
    min: 4,
    max: 12
  },
  sleepQuality: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent']
  },
  
  // Mood and mental health
  currentMood: {
    type: String,
    enum: ['happy', 'neutral', 'sad', 'excited', 'anxious'],
    default: 'neutral'
  },
  moodScore: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  stressLevel: {
    type: Number,
    default: 5,
    min: 1,
    max: 10
  },
  
  // Character progression
  characterLevel: {
    type: Number,
    default: 1,
    min: 1
  },
  experiencePoints: {
    type: Number,
    default: 0,
    min: 0,
    max: 99 // Experience within current level
  },
  experienceToNextLevel: {
    type: Number,
    default: 100,
    min: 1,
    max: 100
  },
  totalExperiencePoints: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Achievement progress
  newAchievements: {
    type: Number,
    default: 0,
    min: 0
  },
  totalAchievements: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Social and engagement
  conversationMessages: {
    type: Number,
    default: 0,
    min: 0
  },
  foodPhotos: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
dashboardStatsSchema.index({ userId: 1, date: -1 });
dashboardStatsSchema.index({ userId: 1, createdAt: -1 });

// Ensure one stats document per user per day
dashboardStatsSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IDashboardStats>('DashboardStats', dashboardStatsSchema);