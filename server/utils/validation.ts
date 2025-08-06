// Validation schemas and utilities

export interface HealthLogSchema {
  type: string;
  title: string;
  description?: string;
  data?: any;
  date?: string;
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

export const validateHealthLog = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data.type || typeof data.type !== 'string') {
    errors.push('Type is required and must be a string');
  }

  if (!data.title || typeof data.title !== 'string') {
    errors.push('Title is required and must be a string');
  }

  if (data.date && isNaN(Date.parse(data.date))) {
    errors.push('Date must be a valid ISO string');
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

  if (data.age !== undefined && (typeof data.age !== 'number' || data.age < 1 || data.age > 120)) {
    errors.push('Age must be a number between 1 and 120');
  }

  if (data.gender !== undefined && !['male', 'female', 'other'].includes(data.gender)) {
    errors.push('Gender must be one of: male, female, other');
  }

  if (data.height !== undefined && (typeof data.height !== 'number' || data.height < 50 || data.height > 300)) {
    errors.push('Height must be a number between 50 and 300 cm');
  }

  if (data.activityLevel !== undefined && !['sedentary', 'light', 'moderate', 'active', 'very_active'].includes(data.activityLevel)) {
    errors.push('Activity level must be one of: sedentary, light, moderate, active, very_active');
  }

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
  return {
    type: String(data.type || '').trim(),
    title: String(data.title || '').trim(),
    description: data.description ? String(data.description).trim() : undefined,
    data: data.data || {},
    date: data.date ? String(data.date).trim() : undefined
  };
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

  if (data.displayName !== undefined) {
    sanitized.displayName = String(data.displayName).trim();
  }
  if (data.photoURL !== undefined) {
    sanitized.photoURL = String(data.photoURL).trim();
  }
  if (data.age !== undefined) {
    sanitized.age = Number(data.age);
  }
  if (data.gender !== undefined) {
    sanitized.gender = String(data.gender).trim() as 'male' | 'female' | 'other';
  }
  if (data.height !== undefined) {
    sanitized.height = Number(data.height);
  }
  if (data.activityLevel !== undefined) {
    sanitized.activityLevel = String(data.activityLevel).trim() as any;
  }
  if (data.healthGoals !== undefined && Array.isArray(data.healthGoals)) {
    sanitized.healthGoals = data.healthGoals.map((goal: any) => String(goal).trim());
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