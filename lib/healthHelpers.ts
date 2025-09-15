// Helper functions for health data transformation
import { 
  HealthLogFormData, 
  CreateHealthLogRequest, 
  HealthLogType,
  MoodType,
  MealType 
} from '../shared/types/health';

/**
 * Transform frontend form data to backend API requests
 * This function converts the HealthLogModal form data into proper API requests
 */
export function transformFormDataToApiRequests(formData: HealthLogFormData): CreateHealthLogRequest[] {
  const requests: CreateHealthLogRequest[] = [];
  const currentDate = new Date().toISOString();

  // Weight log
  if (formData.weight && formData.weight > 0) {
    requests.push({
      type: 'weight',
      title: '体重記録',
      data: {
        weight: formData.weight,
        bmi: formData.bmi,
        bodyFat: undefined // Can be added later
      },
      date: currentDate
    });
  }

  // Mood log
  requests.push({
    type: 'mood',
    title: '気分記録',
    data: {
      mood: formData.mood as MoodType,
      energy: formData.energy,
      stress: undefined, // Can be added later
      notes: undefined
    },
    date: currentDate
  });

  // Sleep log (only if sleep data is provided)
  if (formData.sleep !== undefined && formData.sleep > 0) {
    requests.push({
      type: 'sleep',
      title: '睡眠記録',
      data: {
        hours: formData.sleep,
        quality: undefined, // Can be added later
        bedTime: undefined,
        wakeTime: undefined
      },
      date: currentDate
    });
  }

  // Water log (only if water data is provided)
  if (formData.water !== undefined && formData.water > 0) {
    requests.push({
      type: 'water',
      title: '水分補給記録',
      data: {
        amount: formData.water * 250, // Convert glasses to ml (1 glass = 250ml)
        unit: 'ml',
        glasses: formData.water
      },
      date: currentDate
    });
  }

  // Food logs
  if (formData.foodItems && formData.foodItems.length > 0) {
    for (const foodItem of formData.foodItems) {
      const estimatedCalories = estimateFoodCalories(foodItem);
      
      requests.push({
        type: 'food',
        title: '食事記録',
        description: foodItem,
        data: {
          name: foodItem,
          calories: estimatedCalories,
          nutrition: {},
          meal: 'other' as MealType, // Could be enhanced to detect meal type
          hasPhoto: false,
          imageUrl: undefined,
          portion: undefined
        },
        date: currentDate
      });
    }
  }

  // Notes as general health log
  if (formData.notes && formData.notes.trim()) {
    requests.push({
      type: 'other',
      title: '健康メモ',
      description: formData.notes,
      data: {
        category: 'notes',
        value: formData.notes,
        notes: formData.notes
      },
      date: currentDate
    });
  }

  return requests;
}

/**
 * Simple calorie estimation based on common Japanese foods
 */
export function estimateFoodCalories(foodName: string): number {
  const lowerFood = foodName.toLowerCase();
  
  // Rice and grains
  if (lowerFood.includes('ご飯') || lowerFood.includes('米')) return 250;
  if (lowerFood.includes('パン') || lowerFood.includes('bread')) return 200;
  if (lowerFood.includes('麺') || lowerFood.includes('うどん') || lowerFood.includes('ラーメン')) return 300;
  
  // Proteins
  if (lowerFood.includes('肉') || lowerFood.includes('チキン') || lowerFood.includes('鶏')) return 200;
  if (lowerFood.includes('魚') || lowerFood.includes('サーモン') || lowerFood.includes('鮭')) return 150;
  if (lowerFood.includes('卵') || lowerFood.includes('たまご')) return 80;
  
  // Vegetables and salads
  if (lowerFood.includes('サラダ') || lowerFood.includes('野菜')) return 50;
  if (lowerFood.includes('果物') || lowerFood.includes('フルーツ')) return 60;
  
  // Common dishes
  if (lowerFood.includes('カレー')) return 400;
  if (lowerFood.includes('寿司')) return 250;
  if (lowerFood.includes('弁当')) return 500;
  
  // Default estimate
  return 150;
}

/**
 * Validate form data before sending to API
 */
export function validateFormData(formData: HealthLogFormData): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validate weight
  if (formData.weight && (formData.weight < 20 || formData.weight > 300)) {
    errors.push('体重は20kgから300kgの間で入力してください');
  }
  
  // Validate sleep (only if provided)
  if (formData.sleep !== undefined && (formData.sleep < 0 || formData.sleep > 24)) {
    errors.push('睡眠時間は0時間から24時間の間で入力してください');
  }
  
  // Validate water (only if provided)
  if (formData.water !== undefined && (formData.water < 0 || formData.water > 2000)) {
    errors.push('水分摂取は0杯から20杯の間で入力してください');
  }
  
  // Validate energy
  if (formData.energy < 1 || formData.energy > 10) {
    errors.push('エネルギーレベルは1から10の間で入力してください');
  }

  // Validate food items
  if (formData.foodItems && formData.foodItems.length > 0) {
    const invalidFoodItems = formData.foodItems.filter(item => 
      !item || item.trim().length === 0 || item.trim().length > 100
    );
    if (invalidFoodItems.length > 0) {
      errors.push('食事内容は1文字以上100文字以下で入力してください');
    }
  }

  // Validate notes length
  if (formData.notes && formData.notes.length > 500) {
    errors.push('追加メモは500文字以下で入力してください');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Convert mood string to emoji for display
 */
export function getMoodEmoji(mood: MoodType): string {
  const moodEmojis = {
    excited: '🤩',
    happy: '😊',
    neutral: '😐',
    sad: '😢',
    anxious: '😰'
  };
  
  return moodEmojis[mood] || '😐';
}

/**
 * Convert mood string to Japanese label
 */
export function getMoodLabel(mood: MoodType): string {
  const moodLabels = {
    excited: '興奮',
    happy: '幸せ',
    neutral: '普通',
    sad: '悲しい',
    anxious: '不安'
  };
  
  return moodLabels[mood] || '普通';
}

/**
 * Calculate character level based on health level
 * Standardized formula to ensure consistency across components
 */
export function calculateCharacterLevel(healthLevel: number): number {
  // Ensure healthLevel is within valid range
  const validHealthLevel = Math.max(0, Math.min(100, healthLevel));
  
  // Level progression:
  // Level 1: 0-24 health
  // Level 2: 25-49 health
  // Level 3: 50-74 health
  // Level 4: 75-99 health
  // Level 5: 100 health
  return Math.floor(validHealthLevel / 25) + 1;
}

/**
 * Calculate experience progress within current level
 */
export function calculateLevelProgress(healthLevel: number): number {
  const validHealthLevel = Math.max(0, Math.min(100, healthLevel));
  return (validHealthLevel % 25) * 4; // Convert to 0-100 scale for progress bar
}
