// Validation schemas and utilities
import { 
  HealthLogType, 
  MoodType, 
  MealType, 
  ExerciseIntensity,
  BaseHealthLogData,
  HealthLogDataUnion,
  WeightLogData,
  MoodLogData,
  SleepLogData,
  WaterLogData,
  FoodLogData,
  ExerciseLogData,
  MedicationLogData,
  OtherLogData,
  ValidationResult
} from '../../shared/types/health';

export interface HealthLogSchema extends BaseHealthLogData {
  data: HealthLogDataUnion;
}

export interface FoodDataSchema {
  name: string;
  calories: number;
  nutrition?: any;
  meal?: string;
  date?: string;
  imageUrl?: string;
}

export interface UserProfileSchema {
  displayName?: string;
  photoURL?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  healthGoals?: string[];
}

// Validate specific health log data based on type
export const validateHealthLogData = (type: HealthLogType, data: any): ValidationResult => {
  const errors: string[] = [];

  switch (type) {
    case 'weight':
      if (typeof data.weight !== 'number' || data.weight < 20 || data.weight > 300) {
        errors.push('Weight must be a number between 20 and 300 kg');
      }
      break;

    case 'mood':
      const validMoods: MoodType[] = ['excited', 'happy', 'neutral', 'sad', 'anxious'];
      if (!validMoods.includes(data.mood)) {
        errors.push('Mood must be one of: excited, happy, neutral, sad, anxious');
      }
      if (typeof data.energy !== 'number' || data.energy < 1 || data.energy > 10) {
        errors.push('Energy must be a number between 1 and 10');
      }
      break;

    case 'sleep':
      if (typeof data.hours !== 'number' || data.hours < 0 || data.hours > 24) {
        errors.push('Sleep hours must be a number between 0 and 24');
      }
      break;

    case 'water':
      if (typeof data.amount !== 'number' || data.amount < 0) {
        errors.push('Water amount must be a positive number');
      }
      if (data.unit && !['ml', 'oz', 'cups'].includes(data.unit)) {
        errors.push('Water unit must be one of: ml, oz, cups');
      }
      break;

    case 'food':
      if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Food name is required and cannot be empty');
      }
      if (typeof data.calories !== 'number' || data.calories < 0) {
        errors.push('Calories must be a non-negative number');
      }
      const validMeals: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];
      if (data.meal && !validMeals.includes(data.meal)) {
        errors.push('Meal must be one of: breakfast, lunch, dinner, snack, other');
      }
      break;

    case 'exercise':
      if (!data.exerciseType || typeof data.exerciseType !== 'string') {
        errors.push('Exercise type is required and must be a string');
      }
      if (typeof data.duration !== 'number' || data.duration <= 0) {
        errors.push('Duration must be a positive number');
      }
      const validIntensities: ExerciseIntensity[] = ['low', 'moderate', 'high', 'very_high'];
      if (data.intensity && !validIntensities.includes(data.intensity)) {
        errors.push('Intensity must be one of: low, moderate, high, very_high');
      }
      break;

    case 'medication':
      if (!data.medicationName || typeof data.medicationName !== 'string') {
        errors.push('Medication name is required and must be a string');
      }
      if (!data.dosage || typeof data.dosage !== 'string') {
        errors.push('Dosage is required and must be a string');
      }
      break;

    case 'other':
      // Allow flexible data for other types
      break;

    default:
      errors.push('Invalid health log type');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateHealthLog = (data: any): ValidationResult => {
  const errors: string[] = [];

  // Validate basic required fields
  if (!data.type || typeof data.type !== 'string') {
    errors.push('Type is required and must be a string');
    return { isValid: false, errors };
  }

  const validTypes: HealthLogType[] = ['food', 'exercise', 'water', 'weight', 'medication', 'mood', 'sleep', 'other'];
  if (!validTypes.includes(data.type as HealthLogType)) {
    errors.push('Invalid health log type');
    return { isValid: false, errors };
  }

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required and must be a string');
  }

  if (data.date && isNaN(Date.parse(data.date))) {
    errors.push('Date must be a valid ISO string');
  }

  // Validate data field based on type
  if (data.data) {
    const dataValidation = validateHealthLogData(data.type as HealthLogType, data.data);
    errors.push(...dataValidation.errors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateFoodData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.name || typeof data.name !== 'string') {
    errors.push('Food name is required and must be a string');
  }

  if (data.calories === undefined || typeof data.calories !== 'number' || data.calories < 0) {
    errors.push('Calories is required and must be a non-negative number');
  }

  if (data.date && isNaN(Date.parse(data.date))) {
    errors.push('Date must be a valid ISO string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUserProfile = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Validate displayName
  if (data.displayName !== undefined && (typeof data.displayName !== 'string' || data.displayName.trim().length === 0)) {
    errors.push('Display name must be a non-empty string');
  }

  if (data.displayName !== undefined && data.displayName.trim().length > 50) {
    errors.push('Display name must be 50 characters or less');
  }

  // Validate age
  if (data.age !== undefined && (typeof data.age !== 'number' || isNaN(data.age) || data.age < 1 || data.age > 120)) {
    errors.push('Age must be a number between 1 and 120');
  }

  // Validate gender
  if (data.gender !== undefined && !['male', 'female', 'other'].includes(data.gender)) {
    errors.push('Gender must be one of: male, female, other');
  }

  // Validate height
  if (data.height !== undefined && (typeof data.height !== 'number' || isNaN(data.height) || data.height < 50 || data.height > 300)) {
    errors.push('Height must be a number between 50 and 300 cm');
  }

  // Validate activity level
  if (data.activityLevel !== undefined && !['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(data.activityLevel)) {
    errors.push('Activity level must be one of: sedentary, light, moderate, active, very_active');
  }

  // Validate health goals
  if (data.healthGoals !== undefined && !Array.isArray(data.healthGoals)) {
    errors.push('Health goals must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Sanitize data to prevent injection attacks
export const sanitizeHealthLogData = (data: any): HealthLogSchema => {
  const sanitized: any = {
    type: String(data.type || '').trim() as HealthLogType,
    title: String(data.title || '').trim(),
    description: data.description ? String(data.description).trim() : undefined,
    date: data.date ? String(data.date).trim() : new Date().toISOString()
  };

  // Sanitize data field based on type
  const type = sanitized.type as HealthLogType;
  const logData = data.data || {};

  switch (type) {
    case 'weight':
      sanitized.data = {
        weight: Number(logData.weight) || 0,
        bmi: logData.bmi ? Number(logData.bmi) : undefined,
        bodyFat: logData.bodyFat ? Number(logData.bodyFat) : undefined
      };
      break;

    case 'mood':
      sanitized.data = {
        mood: String(logData.mood || 'neutral').trim() as MoodType,
        energy: Number(logData.energy) || 5,
        stress: logData.stress ? Number(logData.stress) : undefined,
        notes: logData.notes ? String(logData.notes).trim() : undefined
      };
      break;

    case 'sleep':
      sanitized.data = {
        hours: Number(logData.hours) || 8,
        quality: logData.quality ? Number(logData.quality) : undefined,
        bedTime: logData.bedTime ? String(logData.bedTime).trim() : undefined,
        wakeTime: logData.wakeTime ? String(logData.wakeTime).trim() : undefined
      };
      break;

    case 'water':
      sanitized.data = {
        amount: Number(logData.amount) || 0,
        unit: String(logData.unit || 'ml').trim(),
        glasses: logData.glasses ? Number(logData.glasses) : undefined
      };
      break;

    case 'food':
      sanitized.data = {
        name: String(logData.name || '').trim(),
        calories: Number(logData.calories) || 0,
        nutrition: logData.nutrition || {},
        meal: String(logData.meal || 'other').trim() as MealType,
        hasPhoto: Boolean(logData.hasPhoto),
        imageUrl: logData.imageUrl ? String(logData.imageUrl).trim() : undefined,
        portion: logData.portion ? String(logData.portion).trim() : undefined
      };
      break;

    case 'exercise':
      sanitized.data = {
        exerciseType: String(logData.exerciseType || '').trim(),
        duration: Number(logData.duration) || 0,
        intensity: String(logData.intensity || 'moderate').trim() as ExerciseIntensity,
        caloriesBurned: logData.caloriesBurned ? Number(logData.caloriesBurned) : undefined,
        notes: logData.notes ? String(logData.notes).trim() : undefined
      };
      break;

    case 'medication':
      sanitized.data = {
        medicationName: String(logData.medicationName || '').trim(),
        dosage: String(logData.dosage || '').trim(),
        time: String(logData.time || '').trim(),
        notes: logData.notes ? String(logData.notes).trim() : undefined
      };
      break;

    case 'other':
    default:
      sanitized.data = {
        category: logData.category ? String(logData.category).trim() : undefined,
        value: logData.value,
        notes: logData.notes ? String(logData.notes).trim() : undefined,
        ...logData // Allow additional fields for flexibility
      };
      break;
  }

  return sanitized as HealthLogSchema;
};

export const sanitizeFoodData = (data: any): FoodDataSchema => {
  return {
    name: String(data.name || '').trim(),
    calories: Number(data.calories) || 0,
    nutrition: data.nutrition || {},
    meal: data.meal ? String(data.meal).trim() : undefined,
    date: data.date ? String(data.date).trim() : undefined,
    imageUrl: data.imageUrl ? String(data.imageUrl).trim() : undefined
  };
};

export const sanitizeUserProfile = (data: any): UserProfileSchema => {
  const sanitized: UserProfileSchema = {};

  if (data.displayName !== undefined && data.displayName !== null && data.displayName !== '') {
    sanitized.displayName = String(data.displayName).trim();
  }
  
  if (data.photoURL !== undefined && data.photoURL !== null && data.photoURL !== '') {
    sanitized.photoURL = String(data.photoURL).trim();
  }
  
  if (data.age !== undefined && data.age !== null && data.age !== '') {
    const ageNum = Number(data.age);
    if (!isNaN(ageNum)) {
      sanitized.age = ageNum;
    }
  }
  
  if (data.gender !== undefined && data.gender !== null && data.gender !== '') {
    const genderStr = String(data.gender).trim();
    if (['male', 'female', 'other'].includes(genderStr)) {
      sanitized.gender = genderStr as 'male' | 'female' | 'other';
    }
  }
  
  if (data.height !== undefined && data.height !== null && data.height !== '') {
    const heightNum = Number(data.height);
    if (!isNaN(heightNum)) {
      sanitized.height = heightNum;
    }
  }
  
  if (data.activityLevel !== undefined && data.activityLevel !== null && data.activityLevel !== '') {
    const activityStr = String(data.activityLevel).trim();
    if (['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(activityStr)) {
      sanitized.activityLevel = activityStr as any;
    }
  }
  
  if (data.healthGoals !== undefined && data.healthGoals !== null && Array.isArray(data.healthGoals)) {
    sanitized.healthGoals = data.healthGoals
      .filter((goal: any) => goal !== null && goal !== undefined && goal !== '')
      .map((goal: any) => String(goal).trim());
  }

  return sanitized;
};

// Chat validation schemas
export interface ChatMessageSchema {
  content: string;
  type?: 'text' | 'image' | 'health_data' | 'suggestion' | 'system_notification';
  conversationId?: string;
  metadata?: any;
  attachments?: any[];
}

export interface ConversationSchema {
  title?: string;
  tags?: string[];
  metadata?: any;
}

export const validateChatMessage = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.push('Message content is required and cannot be empty');
  }

  if (data.content && data.content.length > 4000) {
    errors.push('Message content cannot exceed 4000 characters');
  }

  if (data.type && !['text', 'image', 'health_data', 'suggestion', 'system_notification'].includes(data.type)) {
    errors.push('Invalid message type');
  }

  if (data.conversationId && typeof data.conversationId !== 'string') {
    errors.push('Conversation ID must be a valid string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateConversation = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.title && (typeof data.title !== 'string' || data.title.length > 100)) {
    errors.push('Title must be a string with maximum 100 characters');
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }

  if (data.tags && data.tags.some((tag: any) => typeof tag !== 'string')) {
    errors.push('All tags must be strings');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const sanitizeChatMessage = (data: any): ChatMessageSchema => {
  return {
    content: String(data.content || '').trim(),
    type: data.type ? String(data.type).trim() as any : 'text',
    conversationId: data.conversationId ? String(data.conversationId).trim() : undefined,
    metadata: data.metadata || {},
    attachments: Array.isArray(data.attachments) ? data.attachments : []
  };
};

export const sanitizeConversation = (data: any): ConversationSchema => {
  const sanitized: ConversationSchema = {};

  if (data.title !== undefined) {
    sanitized.title = String(data.title).trim();
  }
  if (data.tags !== undefined && Array.isArray(data.tags)) {
    sanitized.tags = data.tags.map((tag: any) => String(tag).trim().toLowerCase());
  }
  if (data.metadata !== undefined) {
    sanitized.metadata = data.metadata;
  }

  return sanitized;
};