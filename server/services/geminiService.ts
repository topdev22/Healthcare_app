import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

interface FoodItem {
  name: string;
  calories: number;
  confidence: number;
  nutrition: {
    carbs: number;
    fiber: number;
    sugars: number;
    protein: number;
    fat: number;
  };
}

interface FoodAnalysisResult {
  foodItems: FoodItem[];
  totalCalories: number;
  imageUrl: string;
}

interface GeminiServiceConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private config: Required<GeminiServiceConfig>;

  constructor(config: GeminiServiceConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.GEMINI_API_KEY || '',
      model: config.model || 'gemini-pro-vision',
      maxTokens: config.maxTokens || 1000,
      temperature: config.temperature || 0.3
    };

    this.validateConfiguration();
    this.initializeClient();
  }

  private validateConfiguration(): void {
    if (!this.config.apiKey) {
      console.warn('⚠️  GEMINI_API_KEY not configured. Add your Gemini API key to .env file:');
      console.warn('   GEMINI_API_KEY=your-actual-api-key-here');
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
  }

  private initializeClient(): void {
    try {
      this.genAI = new GoogleGenerativeAI(this.config.apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: this.config.model,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens,
          temperature: this.config.temperature,
        }
      });
      console.log('✅ Gemini client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini client:', error);
      throw error;
    }
  }

  /**
   * Analyze food image and extract nutritional information
   */
  async analyzeFoodImage(imageData: string): Promise<FoodAnalysisResult> {
    try {
      console.log('🔍 Starting food image analysis with Gemini...');
      
      const prompt = this.buildFoodAnalysisPrompt();
      const base64Data = this.extractBase64Data(imageData);
      
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg'
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      console.log('📝 Gemini API response received');
      
      return this.parseFoodAnalysisResponse(text, imageData);
      
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      throw new Error(`Food analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the prompt for food analysis
   */
  private buildFoodAnalysisPrompt(): string {
    return `
      Analyze this food image and provide detailed nutritional information in the following JSON format:
      {
        "foodItems": [
          {
            "name": "food name in Japanese",
            "calories": estimated_calories,
            "confidence": confidence_score_0_to_1,
            "nutrition": {
              "carbs": grams,
              "fiber": grams,
              "sugars": grams,
              "protein": grams,
              "fat": grams
            }
          }
        ],
        "totalCalories": sum_of_all_calories
      }

      Guidelines:
      - Be accurate with calorie estimates based on typical serving sizes
      - Provide nutrition information in grams
      - Use Japanese names for food items when possible
      - Set confidence score based on how clearly the food is visible
      - If you cannot identify any food items, return an empty foodItems array
      - Always return valid JSON format
      - Consider typical Japanese meal portions and cooking methods
      - Include common side dishes and condiments if visible
    `;
  }

  /**
   * Extract base64 data from data URL
   */
  private extractBase64Data(imageData: string): string {
    if (imageData.startsWith('data:')) {
      return imageData.split(',')[1];
    }
    return imageData;
  }

  /**
   * Parse the Gemini API response into structured data
   */
  private parseFoodAnalysisResponse(responseText: string, imageUrl: string): FoodAnalysisResult {
    try {
      // Clean the response text to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsedResult = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (!parsedResult.foodItems || !Array.isArray(parsedResult.foodItems)) {
        throw new Error('Invalid response structure: foodItems array missing');
      }

      // Calculate total calories if not provided
      const totalCalories = parsedResult.totalCalories || 
        parsedResult.foodItems.reduce((sum: number, item: FoodItem) => sum + (item.calories || 0), 0);

      return {
        foodItems: parsedResult.foodItems.map((item: any) => ({
          name: item.name || 'Unknown Food',
          calories: item.calories || 0,
          confidence: item.confidence || 0.5,
          nutrition: {
            carbs: item.nutrition?.carbs || 0,
            fiber: item.nutrition?.fiber || 0,
            sugars: item.nutrition?.sugars || 0,
            protein: item.nutrition?.protein || 0,
            fat: item.nutrition?.fat || 0
          }
        })),
        totalCalories,
        imageUrl
      };

    } catch (parseError) {
      console.error('❌ Failed to parse Gemini response as JSON:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Invalid response format from Gemini API');
    }
  }

  /**
   * Get fallback food analysis data
   */
  static getFallbackAnalysis(imageUrl: string): FoodAnalysisResult {
    console.log('🔄 Using fallback food analysis data');
    
    return {
      foodItems: [
        {
          name: 'ご飯',
          calories: 268,
          confidence: 0.95,
          nutrition: {
            carbs: 58,
            fiber: 0.6,
            sugars: 0.1,
            protein: 5,
            fat: 0.5
          }
        },
        {
          name: '鮭の塩焼き',
          calories: 180,
          confidence: 0.88,
          nutrition: {
            carbs: 0,
            fiber: 0,
            sugars: 0,
            protein: 22,
            fat: 10
          }
        },
        {
          name: '味噌汁',
          calories: 35,
          confidence: 0.92,
          nutrition: {
            carbs: 3,
            fiber: 1,
            sugars: 1,
            protein: 3,
            fat: 1
          }
        }
      ],
      totalCalories: 483,
      imageUrl
    };
  }

  /**
   * Check if the service is properly configured
   */
  static isConfigured(): boolean {
    const apiKey = process.env.GEMINI_API_KEY;
    return !!(apiKey && apiKey !== 'your_gemini_api_key_here');
  }

  /**
   * Get service status information
   */
  static getStatus(): { configured: boolean; model: string } {
    return {
      configured: this.isConfigured(),
      model: 'gemini-pro-vision'
    };
  }
}

export default GeminiService;
export type { FoodAnalysisResult, FoodItem };
