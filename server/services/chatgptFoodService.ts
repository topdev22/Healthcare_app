import OpenAI from 'openai';
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
}

interface ChatGPTFoodServiceConfig {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

class ChatGPTFoodService {
  private openai!: OpenAI;
  private config: Required<ChatGPTFoodServiceConfig>;

  constructor(config: ChatGPTFoodServiceConfig = {}) {
    this.config = {
      apiKey: config.apiKey || process.env.OPENAI_API_KEY || '',
      model: config.model || 'gpt-4o',
      maxTokens: config.maxTokens || 2000,
      temperature: config.temperature || 0.3
    };

    this.validateConfiguration();
    this.initializeClient();
  }

  private validateConfiguration(): void {
    if (!this.config.apiKey) {
      console.warn('⚠️  OPENAI_API_KEY not configured. Add your OpenAI API key to .env file:');
      console.warn('   OPENAI_API_KEY=sk-your-actual-api-key-here');
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }

  private initializeClient(): void {
    try {
      this.openai = new OpenAI({
        apiKey: this.config.apiKey,
      });
      console.log('✅ ChatGPT Food Service client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize ChatGPT Food Service client:', error);
      throw error;
    }
  }

  /**
   * Analyze food image and extract nutritional information
   */
  async analyzeFoodImage(imageData: string): Promise<FoodAnalysisResult> {
    try {
      console.log('🔍 Starting food image analysis with ChatGPT...');
      
      const prompt = this.buildFoodAnalysisPrompt();
      const base64Data = this.extractBase64Data(imageData);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content received from ChatGPT API');
      }
      
      console.log('📝 ChatGPT API response received');
      
      return this.parseFoodAnalysisResponse(content);      
    } catch (error) {
      console.error('❌ ChatGPT API error:', error);
      throw new Error(`Food analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build the prompt for food analysis
   */
  private buildFoodAnalysisPrompt(): string {
    return `Analyze this food image and provide accurate nutritional analysis by breaking down each dish into individual ingredients.

You MUST respond with ONLY valid JSON in this exact format:
{
  "foodItems": [
    {
      "name": "ingredient name in Japanese",
      "calories": realistic_calorie_estimate_per_ingredient,
      "confidence": 0_to_1,
      "nutrition": {
        "carbs": grams,
        "fiber": grams,
        "sugars": grams,
        "protein": grams,
        "fat": grams
      }
    }
  ],
  "totalCalories": sum_of_all_ingredient_calories
}

Critical Analysis Guidelines:
- BREAK DOWN each dish into individual ingredients (e.g., miso soup → miso paste, tofu, seaweed, dashi broth)
- Calculate calories for EACH ingredient separately based on typical Japanese cooking portions
- Use realistic portion sizes: calculate based on standard single-serving portions
- Consider cooking methods: account for calorie changes from grilling, boiling, frying, etc.
- Include ALL visible ingredients: seasonings, oils, garnishes must be included
- Use Japanese ingredient names when possible
- Set confidence based on ingredient visibility and clarity
- If you cannot identify ingredients, return an empty foodItems array
- Always return valid JSON format

Example breakdown:
- Grilled salmon → salmon (200g), salt, oil (small amount)
- Miso soup → miso paste, tofu, seaweed, dashi broth
- Rice → white rice (150g)

Be precise with ingredient quantities and realistic calorie estimates.`;
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
   * Parse the ChatGPT API response into structured data
   */
  private parseFoodAnalysisResponse(responseText: string): FoodAnalysisResult {
    try {
      console.log('🔍 Parsing ChatGPT response:', responseText.substring(0, 200) + '...');
      
      // Clean the response text to extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in response');
        throw new Error('No JSON found in response');
      }

      const jsonString = jsonMatch[0];
      console.log('📋 Extracted JSON string:', jsonString);
      
      const parsedResult = JSON.parse(jsonString);
      console.log('✅ Successfully parsed JSON:', JSON.stringify(parsedResult, null, 2));
      
      // Validate the response structure
      if (!parsedResult.foodItems || !Array.isArray(parsedResult.foodItems)) {
        console.error('❌ Invalid response structure: foodItems array missing');
        throw new Error('Invalid response structure: foodItems array missing');
      }

      // Calculate total calories if not provided
      const totalCalories = parsedResult.totalCalories || 
        parsedResult.foodItems.reduce((sum: number, item: FoodItem) => sum + (item.calories || 0), 0);

      const result: FoodAnalysisResult = {
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
        totalCalories
      };

      console.log('🎯 Final parsed result:', JSON.stringify(result, null, 2));
      return result;

    } catch (parseError) {
      console.error('❌ Failed to parse ChatGPT response as JSON:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('Invalid response format from ChatGPT API');
    }
  }


  /**
   * Check if the service is properly configured
   */
  static isConfigured(): boolean {
    const apiKey = process.env.OPENAI_API_KEY;
    return !!(apiKey && apiKey !== 'your_openai_api_key_here');
  }

  /**
   * Get service status information
   */
  static getStatus(): { configured: boolean; model: string } {
    return {
      configured: this.isConfigured(),
      model: 'gpt-4o'
    };
  }

  /**
   * Get raw JSON response for debugging (development only)
   */
  async getRawJsonResponse(imageData: string): Promise<string> {
    try {
      const prompt = this.buildFoodAnalysisPrompt();
      const base64Data = this.extractBase64Data(imageData);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response content received from ChatGPT API');
      }
      
      return content;
      
    } catch (error) {
      console.error('❌ Error getting raw JSON response:', error);
      throw error;
    }
  }
}

export default ChatGPTFoodService;
export type { FoodAnalysisResult, FoodItem };
