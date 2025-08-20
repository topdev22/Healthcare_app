export type HealthLogType = 'food' | 'exercise' | 'water' | 'weight' | 'medication' | 'mood' | 'sleep' | 'other';
export type MoodType = 'excited' | 'happy' | 'neutral' | 'sad' | 'anxious';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
export type ExerciseIntensity = 'low' | 'moderate' | 'high' | 'very_high';
export interface BaseHealthLogData {
    type: HealthLogType;
    title: string;
    description?: string;
    date: string;
}
export interface WeightLogData {
    weight: number;
    bmi?: number;
    bodyFat?: number;
}
export interface MoodLogData {
    mood: MoodType;
    energy: number;
    stress?: number;
    notes?: string;
}
export interface SleepLogData {
    hours: number;
    quality?: number;
    bedTime?: string;
    wakeTime?: string;
}
export interface WaterLogData {
    amount: number;
    unit: 'ml' | 'oz' | 'cups';
    glasses?: number;
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
    duration: number;
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
export type HealthLogDataUnion = WeightLogData | MoodLogData | SleepLogData | WaterLogData | FoodLogData | ExerciseLogData | MedicationLogData | OtherLogData;
export interface HealthLog extends BaseHealthLogData {
    _id?: string;
    userId?: string;
    data: HealthLogDataUnion;
    createdAt?: Date;
    updatedAt?: Date;
}
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
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}
export declare function isWeightLog(data: HealthLogDataUnion): data is WeightLogData;
export declare function isMoodLog(data: HealthLogDataUnion): data is MoodLogData;
export declare function isSleepLog(data: HealthLogDataUnion): data is SleepLogData;
export declare function isWaterLog(data: HealthLogDataUnion): data is WaterLogData;
export declare function isFoodLog(data: HealthLogDataUnion): data is FoodLogData;
export declare function isExerciseLog(data: HealthLogDataUnion): data is ExerciseLogData;
export declare function isMedicationLog(data: HealthLogDataUnion): data is MedicationLogData;
