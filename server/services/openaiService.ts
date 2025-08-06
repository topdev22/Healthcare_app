import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

interface HealthContext {
  recentHealthLogs?: any[];
  userProfile?: {
    age?: number;
    gender?: string;
    height?: number;
    activityLevel?: string;
    healthGoals?: string[];
  };
  currentMood?: string;
  conversationHistory?: any[];
}

interface ChatCompletionRequest {
  message: string;
  userName?: string;
  healthContext?: HealthContext;
  conversationId?: string;
}

interface ChatCompletionResponse {
  message: string;
  mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious';
  confidence: number;
  topics: string[];
  intent: string;
  responseTime: number;
  tokens?: number;
  model: string;
}

class OpenAIService {
  private openai: OpenAI;
  private defaultModel = 'gpt-4o';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('apiKey', apiKey);
    
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      console.warn('⚠️  OPENAI_API_KEY not configured. Add your OpenAI API key to .env file:');
      console.warn('   OPENAI_API_KEY=sk-your-actual-api-key-here');
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey,
      });
      console.log('✅ OpenAI client initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI client:', error);
      throw error;
    }
  }

  async generateChatResponse(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    
    try {
      const systemPrompt = this.buildSystemPrompt(request.healthContext, request.userName);
      const userMessage = this.buildUserMessage(request.message, request.healthContext);

      const completion = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const responseTime = Date.now() - startTime;
      const aiMessage = completion.choices[0]?.message?.content || '申し訳ございませんが、お返事できませんでした。もう一度お試しください。';

      // Analyze the response to extract metadata
      const analysis = this.analyzeResponse(request.message, aiMessage);

      return {
        message: aiMessage,
        mood: analysis.mood,
        confidence: analysis.confidence,
        topics: analysis.topics,
        intent: analysis.intent,
        responseTime,
        tokens: completion.usage?.total_tokens,
        model: this.defaultModel
      };

    } catch (error) {
      console.error('OpenAI API error:', error);
      
      // Fallback to a health-focused response if OpenAI fails
      const fallbackResponse = this.getFallbackResponse(request.message, request.userName);
      
      return {
        ...fallbackResponse,
        responseTime: Date.now() - startTime,
        model: 'fallback-health-assistant'
      };
    }
  }

  private buildSystemPrompt(healthContext?: HealthContext, userName?: string): string {
    const name = userName || 'ユーザー';
    
    let systemPrompt = `あなたは健康管理アプリの親しみやすいAIアシスタントです。以下の特徴を持ってください：

**基本性格:**
- 温かく親しみやすい口調で日本語で応答
- ${name}さんの健康目標達成を全力でサポート
- 励ましと共感の気持ちを込めて対話
- 医療アドバイスではなく、一般的な健康情報の提供に留める

**対応分野:**
- 体重管理・ダイエット
- 食事・栄養バランス
- 運動・フィットネス
- 睡眠の質改善
- メンタルヘルス・ストレス管理
- 水分補給・生活習慣

**応答スタイル:**
- 絵文字を適度に使用して親しみやすく
- 具体的で実践的なアドバイスを提供
- ユーザーの気持ちに寄り添う共感的な表現
- 200文字以内で簡潔かつ温かい回答`;

    // Add health context if available
    if (healthContext?.userProfile) {
      const profile = healthContext.userProfile;
      systemPrompt += `\n\n**${name}さんのプロフィール:**`;
      
      if (profile.age) systemPrompt += `\n- 年齢: ${profile.age}歳`;
      if (profile.gender) systemPrompt += `\n- 性別: ${profile.gender}`;
      if (profile.height) systemPrompt += `\n- 身長: ${profile.height}cm`;
      if (profile.activityLevel) systemPrompt += `\n- 活動レベル: ${profile.activityLevel}`;
      if (profile.healthGoals && profile.healthGoals.length > 0) {
        systemPrompt += `\n- 健康目標: ${profile.healthGoals.join(', ')}`;
      }
    }

    // Add recent health data context
    if (healthContext?.recentHealthLogs && healthContext.recentHealthLogs.length > 0) {
      systemPrompt += `\n\n**最近の健康記録:**`;
      
      const recentLogs = healthContext.recentHealthLogs.slice(0, 3);
      recentLogs.forEach(log => {
        if (log.type === 'health_log' && log.data) {
          systemPrompt += `\n- ${new Date(log.date).toLocaleDateString()}: `;
          if (log.data.weight) systemPrompt += `体重${log.data.weight}kg `;
          if (log.data.mood) systemPrompt += `気分:${log.data.mood} `;
          if (log.data.sleep) systemPrompt += `睡眠:${log.data.sleep}時間 `;
        }
      });
    }

    // Add current mood context
    if (healthContext?.currentMood) {
      systemPrompt += `\n\n**現在の気分:** ${healthContext.currentMood}`;
    }

    systemPrompt += `\n\n必ず${name}さんに寄り添い、健康的な生活習慣の継続を応援してください。`;

    return systemPrompt;
  }

  private buildUserMessage(message: string, healthContext?: HealthContext): string {
    let userMessage = message;

    // Add context about what the user is doing in the app
    if (healthContext?.recentHealthLogs) {
      const hasRecentLog = healthContext.recentHealthLogs.some(log => {
        const logDate = new Date(log.date);
        const today = new Date();
        return logDate.toDateString() === today.toDateString();
      });

      if (hasRecentLog) {
        userMessage += '\n\n（今日、健康データを記録しました）';
      }
    }

    return userMessage;
  }

  private analyzeResponse(userMessage: string, aiResponse: string): {
    mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious';
    confidence: number;
    topics: string[];
    intent: string;
  } {
    const lowerUserMessage = userMessage.toLowerCase();
    const lowerAiResponse = aiResponse.toLowerCase();

    // Determine mood based on response content
    let mood: 'happy' | 'neutral' | 'sad' | 'excited' | 'anxious' = 'happy';
    
    if (lowerAiResponse.includes('素晴らしい') || lowerAiResponse.includes('頑張') || lowerAiResponse.includes('👏')) {
      mood = 'excited';
    } else if (lowerAiResponse.includes('心配') || lowerAiResponse.includes('大変') || lowerAiResponse.includes('😰')) {
      mood = 'anxious';
    } else if (lowerAiResponse.includes('お疲れ') || lowerAiResponse.includes('ゆっくり') || lowerAiResponse.includes('😌')) {
      mood = 'neutral';
    } else if (lowerAiResponse.includes('💪') || lowerAiResponse.includes('やったね') || lowerAiResponse.includes('🎉')) {
      mood = 'excited';
    }

    // Extract topics
    const topics: string[] = [];
    if (lowerUserMessage.includes('体重') || lowerUserMessage.includes('weight')) topics.push('体重管理');
    if (lowerUserMessage.includes('食事') || lowerUserMessage.includes('食べ')) topics.push('食事');
    if (lowerUserMessage.includes('運動') || lowerUserMessage.includes('エクササイズ')) topics.push('運動');
    if (lowerUserMessage.includes('睡眠') || lowerUserMessage.includes('寝る')) topics.push('睡眠');
    if (lowerUserMessage.includes('気分') || lowerUserMessage.includes('ストレス')) topics.push('メンタルヘルス');
    if (lowerUserMessage.includes('水') || lowerUserMessage.includes('水分')) topics.push('水分補給');

    // Determine intent
    let intent = 'general_health_support';
    if (topics.includes('体重管理')) intent = 'weight_management';
    else if (topics.includes('食事')) intent = 'nutrition_guidance';
    else if (topics.includes('運動')) intent = 'exercise_support';
    else if (topics.includes('睡眠')) intent = 'sleep_guidance';
    else if (topics.includes('メンタルヘルス')) intent = 'mental_health_support';
    else if (lowerUserMessage.includes('こんにちは') || lowerUserMessage.includes('おはよう')) intent = 'greeting';

    // Confidence based on response length and specificity
    const confidence = Math.min(0.95, 0.7 + (aiResponse.length / 1000) * 0.2);

    return { mood, confidence, topics, intent };
  }

  private getFallbackResponse(message: string, userName?: string): Omit<ChatCompletionResponse, 'responseTime' | 'model'> {
    const name = userName || 'あなた';
    const lowerMessage = message.toLowerCase();

    // Simple fallback responses for common health topics
    if (lowerMessage.includes('体重')) {
      return {
        message: `${name}さん、体重管理について一緒に考えていきましょう！定期的な記録と小さな目標設定が大切ですね。🏃‍♀️`,
        mood: 'happy',
        confidence: 0.8,
        topics: ['体重管理'],
        intent: 'weight_management',
        tokens: 0
      };
    }

    if (lowerMessage.includes('食事')) {
      return {
        message: `${name}さん、バランスの良い食事を心がけていらっしゃいますね！写真を撮って記録すると、より意識的になりますよ。📸🥗`,
        mood: 'happy',
        confidence: 0.8,
        topics: ['食事'],
        intent: 'nutrition_guidance',
        tokens: 0
      };
    }

    // Default fallback
    return {
      message: `${name}さん、お話しいただきありがとうございます！健康に関することでしたら、いつでもお気軽にご相談ください。一緒に頑張りましょう！✨`,
      mood: 'happy',
      confidence: 0.7,
      topics: ['一般的な健康支援'],
      intent: 'general_health_support',
      tokens: 0
    };
  }

  // Health data analysis for context
  async analyzeHealthTrend(healthLogs: any[]): Promise<string> {
    if (!healthLogs || healthLogs.length === 0) {
      return '';
    }

    try {
      const healthData = healthLogs
        .filter(log => log.type === 'health_log' && log.data)
        .slice(0, 7) // Last 7 entries
        .map(log => ({
          date: log.date,
          weight: log.data.weight,
          mood: log.data.mood,
          sleep: log.data.sleep,
          energy: log.data.energy
        }));

      if (healthData.length === 0) return '';

      const prompt = `以下の健康データを分析して、1-2文で簡潔なトレンド分析を日本語で提供してください：
${JSON.stringify(healthData, null, 2)}

分析ポイント：
- 体重の変化傾向
- 睡眠パターン
- 気分・エネルギーレベル
- 全体的な健康状況

50文字以内で、励ましの言葉を含めて応答してください。`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.5,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Health trend analysis error:', error);
      return '';
    }
  }
}

export default OpenAIService;