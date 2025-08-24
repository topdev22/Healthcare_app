// Shared TypeScript interfaces for health data
// This file defines the data structures used between frontend and backend

export type HealthLogType = 'food' | 'exercise' | 'water' | 'weight' | 'medication' | 'mood' | 'sleep' | 'other';

export type MoodType = 'excited' | 'happy' | 'neutral' | 'sad' | 'anxious';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';

export type ExerciseIntensity = 'low' | 'moderate' | 'high' | 'very_high';

// Base interface for all health logs
export interface BaseHealthLogData {
  type: HealthLogType;
  title: string;
  description?: string;
  date: string; // ISO string
}

// Specific data structures for each health log type
export interface WeightLogData {
  weight: number; // in kg
  bmi?: number;
  bodyFat?: number;
}

export interface MoodLogData {
  mood: MoodType;
  energy: number; // 1-10 scale
  stress?: number; // 1-10 scale
  notes?: string;
}

export interface SleepLogData {
  hours: number; // hours of sleep
  quality?: number; // 1-10 scale
  bedTime?: string; // time string
  wakeTime?: string; // time string
}

export interface WaterLogData {
  amount: number; // in ml
  unit: 'ml' | 'oz' | 'cups';
  glasses?: number; // number of glasses (1 glass = 250ml)
}

export interface FoodLogData {
  name: string;
  calories: number;
  nutrition?: {
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
  };
  meal: MealType;
  hasPhoto?: boolean;
  imageUrl?: string;
  portion?: string;
}

export interface ExerciseLogData {
  exerciseType: string;
  duration: number; // in minutes
  intensity: ExerciseIntensity;
  caloriesBurned?: number;
  notes?: string;
}

export interface MedicationLogData {
  medicationName: string;
  dosage: string;
  time: string;
  notes?: string;
}

export interface OtherLogData {
  category?: string;
  value?: string | number;
  notes?: string;
}

// Union type for all possible data structures
export type HealthLogDataUnion = 
  | WeightLogData 
  | MoodLogData 
  | SleepLogData 
  | WaterLogData 
  | FoodLogData 
  | ExerciseLogData 
  | MedicationLogData 
  | OtherLogData;

// Complete health log interface
export interface HealthLog extends BaseHealthLogData {
  _id?: string;
  userId?: string;
  data: HealthLogDataUnion;
  createdAt?: Date;
  updatedAt?: Date;
}

// Frontend form data interface (matches HealthLogModal)
export interface HealthLogFormData {
  weight?: number;
  height?: number;
  bmi?: number;
  bmr?: number;
  calories?: number;
  tdee?: number;
  mood: MoodType;
  energy: number;
  sleep: number;
  water: number;
  notes?: string;
  foodItems?: string[];
}

// API request interfaces
export interface CreateHealthLogRequest extends BaseHealthLogData {
  data: HealthLogDataUnion;
}

export interface UpdateHealthLogRequest {
  type?: HealthLogType;
  title?: string;
  description?: string;
  data?: Partial<HealthLogDataUnion>;
  date?: string;
}

// API response interfaces
export interface HealthLogResponse {
  success: boolean;
  data: HealthLog;
  message?: string;
}

export interface HealthLogsResponse {
  success: boolean;
  data: HealthLog[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface HealthStatsResponse {
  success: boolean;
  data: {
    totalLogs: number;
    weeklyLogs: number;
    recentMood: MoodType;
    averageWeight?: number;
    exerciseCount: number;
    waterIntake: number;
    sleepHours?: number;
    streak: number;
    period: string;
    healthLogs: HealthLog[];
  };
}

// Validation interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Helper type guards
export function isWeightLog(data: HealthLogDataUnion): data is WeightLogData {
  return 'weight' in data;
}

export function isMoodLog(data: HealthLogDataUnion): data is MoodLogData {
  return 'mood' in data;
}

export function isSleepLog(data: HealthLogDataUnion): data is SleepLogData {
  return 'hours' in data;
}

export function isWaterLog(data: HealthLogDataUnion): data is WaterLogData {
  return 'amount' in data && 'unit' in data;
}

export function isFoodLog(data: HealthLogDataUnion): data is FoodLogData {
  return 'name' in data && 'calories' in data && 'meal' in data;
}

export function isExerciseLog(data: HealthLogDataUnion): data is ExerciseLogData {
  return 'exerciseType' in data && 'duration' in data;
}

export function isMedicationLog(data: HealthLogDataUnion): data is MedicationLogData {
  return 'medicationName' in data && 'dosage' in data;
}
