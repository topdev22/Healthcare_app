import express from 'express';
import { authenticateToken } from '../middleware/auth';
import ChatMessage from '../models/ChatMessage';
import Conversation from '../models/Conversation';
import { User } from '../models/User';
import HealthLog from '../models/HealthLog';
import OpenAIService from '../services/openaiService';
import { checkAndUpdateAchievements } from './achievements';
import { calculateDashboardStats } from './dashboard';
import { 
  validateChatMessage, 
  validateConversation,
  sanitizeChatMessage, 
  sanitizeConversation 
} from '../utils/validation';

const router = express.Router();

// Initialize OpenAI service
let openaiService: OpenAIService | null = null;
let openaiInitError: string | null = null;

try {
  openaiService = new OpenAIService();
  console.log('✅ OpenAI service initialized successfully');
} catch (error) {
  openaiInitError = (error as Error).message;
  console.warn('⚠️ OpenAI service initialization failed:', openaiInitError);
  console.warn('🔄 Chat will use fallback responses');
}

// Helper function to create health logs from extracted chat data
async function createHealthLogsFromChatData(userId: string, extractedData: any) {
  try {
    const currentDate = new Date();
    
    // Create mood log if mood was detected
    if (extractedData.mood) {
      const moodLog = new HealthLog({
        userId,
        type: 'mood',
        title: `気分: ${extractedData.mood}`,
        description: 'チャットから自動記録',
        data: {
          mood: extractedData.mood,
          source: 'chat_extraction'
        },
        date: currentDate
      });
      await moodLog.save();
      console.log(`📝 Auto-created mood log: ${extractedData.mood}`);
    }

    // Create exercise log if exercise was mentioned
    if (extractedData.exercise) {
      const exerciseLog = new HealthLog({
        userId,
        type: 'exercise',
        title: extractedData.exercise,
        description: 'チャットから自動記録',
        data: {
          activity: extractedData.exercise,
          source: 'chat_extraction'
        },
        date: currentDate
      });
      await exerciseLog.save();
      console.log(`🏃‍♀️ Auto-created exercise log: ${extractedData.exercise}`);
    }

    // Create food log if food was mentioned
    if (extractedData.food) {
      const foodLog = new HealthLog({
        userId,
        type: 'food',
        title: extractedData.food,
        description: 'チャットから自動記録',
        data: {
          food: extractedData.food,
          source: 'chat_extraction'
        },
        date: currentDate
      });
      await foodLog.save();
      console.log(`🍽️ Auto-created food log: ${extractedData.food}`);
    }

    // Create water log if water intake was mentioned
    if (extractedData.water && extractedData.water > 0) {
      const waterLog = new HealthLog({
        userId,
        type: 'water',
        title: `水分摂取: ${extractedData.water}杯`,
        description: 'チャットから自動記録',
        data: {
          amount: extractedData.water,
          unit: 'glasses',
          source: 'chat_extraction'
        },
        date: currentDate
      });
      await waterLog.save();
      console.log(`💧 Auto-created water log: ${extractedData.water} glasses`);
    }

    // Create sleep log if sleep was mentioned
    if (extractedData.sleep && extractedData.sleep > 0) {
      const sleepLog = new HealthLog({
        userId,
        type: 'sleep',
        title: `睡眠: ${extractedData.sleep}時間`,
        description: 'チャットから自動記録',
        data: {
          hours: extractedData.sleep,
          source: 'chat_extraction'
        },
        date: currentDate
      });
      await sleepLog.save();
      console.log(`😴 Auto-created sleep log: ${extractedData.sleep} hours`);
    }

    // Create weight log if weight was mentioned
    if (extractedData.weight && extractedData.weight > 0) {
      const weightLog = new HealthLog({
        userId,
        type: 'weight',
        title: `体重: ${extractedData.weight}kg`,
        description: 'チャットから自動記録',
        data: {
          weight: extractedData.weight,
          unit: 'kg',
          source: 'chat_extraction'
        },
        date: currentDate
      });
      await weightLog.save();
      console.log(`⚖️ Auto-created weight log: ${extractedData.weight}kg`);
    }

    // Trigger character level updates and achievements check
    try {
      await checkAndUpdateAchievements(userId);
      console.log('✅ Achievement check completed after chat health data');
    } catch (achievementError) {
      console.warn('⚠️ Achievement check failed:', achievementError);
    }

    // Recalculate dashboard stats to update character level and health metrics
    try {
      await calculateDashboardStats(userId, currentDate);
      console.log('✅ Dashboard stats updated after chat health data');
    } catch (dashboardError) {
      console.warn('⚠️ Dashboard stats update failed:', dashboardError);
    }

    console.log('✅ Health logs auto-created from chat data');
  } catch (error) {
    console.error('❌ Error creating health logs from chat data:', error);
  }
}

// Send chat message and get AI response
router.post('/message', authenticateToken, async (req: any, res) => {
  try {
    const { message, userContext, conversationId } = req.body;
    const userId = req.user._id;
    
    // Validate and sanitize input
    const sanitizedMessage = sanitizeChatMessage({ content: message, conversationId });
    const validation = validateChatMessage(sanitizedMessage);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    console.log('Chat message from user:', userId, 'message:', message);

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({ 
        _id: conversationId, 
        userId, 
        status: 'active' 
      });
    }
    
    if (!conversation) {
      // Create new conversation
      conversation = new Conversation({
        userId,
        title: `Chat ${new Date().toLocaleDateString()}`,
        lastMessageAt: new Date(),
        metadata: {
          userMood: userContext?.mood,
          healthContext: userContext?.healthData
        }
      });
      await conversation.save();
    }

    // Get user's full profile and recent health data for context
    const user = await User.findById(userId).select('-password');
    const recentHealthLogs = await HealthLog.find({ userId })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // Save user message to database
    const userMessage = new ChatMessage({
      conversationId: conversation._id,
      userId,
      sender: 'user',
      content: sanitizedMessage.content,
      type: 'text',
      status: 'sent',
      metadata: {
        userMood: userContext?.mood,
        healthContext: userContext?.healthData,
        topics: extractTopics(sanitizedMessage.content),
        sentiment: analyzeSentiment(sanitizedMessage.content)
      }
    });
    await userMessage.save();

    // Get recent conversation history for context
    const recentMessages = await ChatMessage.find({ 
      conversationId: conversation._id 
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('sender content createdAt')
      .lean();

    // Prepare health context for GPT
    const healthContext = {
      recentHealthLogs,
      userProfile: user ? {
        age: user.age,
        gender: user.gender,
        height: user.height,
        activityLevel: user.activityLevel,
        healthGoals: user.healthGoals
      } : undefined,
      currentMood: userContext?.mood,
      conversationHistory: recentMessages.reverse() // Oldest to newest for better context
    };

    // Generate AI response using GPT or fallback
    let aiResponseData;
    if (openaiService) {
      try {
        console.log('🤖 Generating GPT response for user:', userId);
        aiResponseData = await openaiService.generateChatResponse({
          message: sanitizedMessage.content,
          userName: user?.displayName || userContext?.displayName,
          healthContext,
          conversationId: conversation._id.toString()
        });
      } catch (gptError) {
        console.error('GPT response failed, using fallback:', gptError);
        aiResponseData = generateHealthResponse(sanitizedMessage.content, userContext);
      }
    } else {
      console.log('📝 Using fallback response system');
      aiResponseData = generateHealthResponse(sanitizedMessage.content, userContext);
    }

    // Save AI response to database
    const aiMessage = new ChatMessage({
      conversationId: conversation._id,
      userId,
      sender: 'assistant',
      content: aiResponseData.message,
      type: 'text',
      status: 'sent',
      aiResponse: {
        mood: aiResponseData.mood,
        confidence: aiResponseData.confidence || 0.8,
        responseTime: aiResponseData.responseTime || 0,
        model: aiResponseData.model || 'health-assistant-v1',
        tokens: aiResponseData.tokens
      },
      metadata: {
        topics: aiResponseData.topics || extractTopics(aiResponseData.message),
        intent: aiResponseData.intent || 'general_health_support',
        extractedHealthData: aiResponseData.extractedHealthData
      }
    });
    await aiMessage.save();

    // Auto-create health logs from extracted data
    if (aiResponseData.extractedHealthData && Object.keys(aiResponseData.extractedHealthData).length > 0) {
      await createHealthLogsFromChatData(userId, aiResponseData.extractedHealthData);
    }

    // Always trigger character updates for chat activity (experience gain)
    try {
      await calculateDashboardStats(userId, new Date());
      console.log('✅ Dashboard stats updated for chat activity experience');
    } catch (dashboardError) {
      console.warn('⚠️ Dashboard stats update for chat activity failed:', dashboardError);
    }

    // Update conversation with latest activity
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessageAt: new Date(),
      $inc: { messageCount: 2 }, // Increment by 2 (user message + AI response)
      'metadata.topics': Array.from(new Set([
        ...(conversation.metadata?.topics || []),
        ...extractTopics(sanitizedMessage.content)
      ]))
    });

    res.json({
      success: true,
      message: aiResponseData.message,
      mood: aiResponseData.mood || 'happy',
      conversationId: conversation._id,
      messageId: aiMessage._id,
      userMessageId: userMessage._id,
      healthDataExtracted: aiResponseData.extractedHealthData && Object.keys(aiResponseData.extractedHealthData).length > 0,
      extractedHealthData: aiResponseData.extractedHealthData,
      metadata: {
        responseTime: aiResponseData.responseTime || 0,
        topics: aiResponseData.topics,
        confidence: aiResponseData.confidence,
        model: aiResponseData.model,
        tokens: aiResponseData.tokens,
        intent: aiResponseData.intent
      }
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get health trend analysis
router.get('/health-analysis', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;

    if (!openaiService) {
      return res.status(503).json({ 
        message: 'AI service unavailable', 
        fallback: 'Health analysis requires OpenAI integration' 
      });
    }

    // Get recent health logs
    const recentHealthLogs = await HealthLog.find({ userId })
      .sort({ date: -1 })
      .limit(14)
      .lean();

    if (recentHealthLogs.length === 0) {
      return res.json({
        success: true,
        analysis: 'まだ健康データが記録されていません。データを記録して、トレンド分析を確認しましょう！',
        recommendation: '体重、気分、睡眠、エネルギーレベルを記録することから始めてみてください。'
      });
    }

    const analysis = await openaiService.analyzeHealthTrend(recentHealthLogs);

    res.json({
      success: true,
      analysis: analysis || '健康データを継続的に記録していただき、ありがとうございます！',
      dataPoints: recentHealthLogs.length,
      period: '過去2週間'
    });

  } catch (error) {
    console.error('Health analysis error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get chat history for a conversation
router.get('/history/:conversationId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.conversationId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log('Getting chat history for user:', userId, 'conversation:', conversationId);

    // Verify conversation belongs to user
    const conversation = await Conversation.findOne({ 
      _id: conversationId, 
      userId, 
      status: 'active' 
    });

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    // Get messages for the conversation
    const total = await ChatMessage.countDocuments({ conversationId });
    const messages = await ChatMessage.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('userId', 'displayName photoURL')
      .lean();

    res.json({
      success: true,
      data: messages.reverse(), // Reverse to show oldest first
      conversation: {
        id: conversation._id,
        title: conversation.title,
        lastMessageAt: conversation.lastMessageAt,
        messageCount: conversation.messageCount
      },
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all conversations for a user
router.get('/conversations', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    const status = req.query.status as string || 'active';

    console.log('Getting conversations for user:', userId);

    const total = await Conversation.countDocuments({ userId, status });
    const conversations = await Conversation.find({ userId, status })
      .sort({ lastMessageAt: -1 })
      .limit(limit)
      .skip(offset)
      .select('title lastMessageAt messageCount metadata createdAt')
      .lean();

    res.json({
      success: true,
      data: conversations,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create a new conversation
router.post('/conversations', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    
    const sanitizedData = sanitizeConversation(req.body);
    const validation = validateConversation(sanitizedData);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    const conversation = new Conversation({
      userId,
      title: sanitizedData.title || `Chat ${new Date().toLocaleDateString()}`,
      tags: sanitizedData.tags || [],
      metadata: sanitizedData.metadata || {}
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update conversation
router.put('/conversations/:conversationId', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.conversationId;
    
    const sanitizedData = sanitizeConversation(req.body);
    const validation = validateConversation(sanitizedData);
    
    if (!validation.isValid) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validation.errors 
      });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId },
      { ...sanitizedData, updatedAt: new Date() },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Update conversation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Archive conversation
router.patch('/conversations/:conversationId/archive', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const conversationId = req.params.conversationId;

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId },
      { status: 'archived', updatedAt: new Date() },
      { new: true }
    );

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search messages
router.get('/search', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Text search in message content
    const messages = await ChatMessage.find({
      userId,
      $text: { $search: query }
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(offset)
    .populate('conversationId', 'title')
    .lean();

    res.json({
      success: true,
      data: messages,
      query,
      pagination: {
        limit,
        offset,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Extract topics from message content
function extractTopics(message: string): string[] {
  const topics: string[] = [];
  const lowerMessage = message.toLowerCase();
  
  // Health topics
  if (lowerMessage.includes('体重') || lowerMessage.includes('weight')) topics.push('体重管理');
  if (lowerMessage.includes('食事') || lowerMessage.includes('食べ') || lowerMessage.includes('料理')) topics.push('食事');
  if (lowerMessage.includes('運動') || lowerMessage.includes('エクササイズ')) topics.push('運動');
  if (lowerMessage.includes('睡眠') || lowerMessage.includes('寝る')) topics.push('睡眠');
  if (lowerMessage.includes('気分') || lowerMessage.includes('ストレス')) topics.push('メンタルヘルス');
  if (lowerMessage.includes('水') || lowerMessage.includes('飲み物')) topics.push('水分補給');
  if (lowerMessage.includes('薬') || lowerMessage.includes('サプリ')) topics.push('薬・サプリメント');
  
  return topics;
}

// Simple sentiment analysis
function analyzeSentiment(message: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['嬉しい', '楽しい', '良い', 'いい', 'ありがとう', '感謝', '頑張る'];
  const negativeWords = ['辛い', '疲れ', 'ストレス', '悪い', '痛い', '不安', '心配'];
  
  const lowerMessage = message.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
  
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

// Enhanced health-focused response generator (fallback when GPT is unavailable)
function generateHealthResponse(message: string, userContext: any) {
  const lowerMessage = message.toLowerCase();
  const userName = userContext?.displayName || 'あなた';
  const topics = extractTopics(message);
  const responseTime = Math.floor(Math.random() * 100) + 50; // Simulate response time
  
  // Health-related keywords and responses
  if (lowerMessage.includes('体重') || lowerMessage.includes('weight')) {
    return {
      message: `${userName}さん、体重管理についてお聞かせください！定期的な計測は健康管理の基本ですね。目標体重はありますか？🏃‍♀️`,
      mood: 'happy' as const,
      confidence: 0.9,
      topics: ['体重管理'],
      intent: 'weight_management',
      responseTime,
      tokens: 0,
      model: 'fallback-health-assistant'
    };
  }

  if (lowerMessage.includes('食事') || lowerMessage.includes('食べ') || lowerMessage.includes('料理')) {
    return {
      message: `${userName}さん、食事について話しましょう！バランスの良い食事は健康の基盤です。今日は何を食べましたか？写真を撮って記録してみませんか？📸🥗`,
      mood: 'excited' as const,
      confidence: 0.9,
      topics: ['食事', '栄養'],
      intent: 'nutrition_guidance',
      responseTime,
      tokens: 0,
      model: 'fallback-health-assistant'
    };
  }

  if (lowerMessage.includes('運動') || lowerMessage.includes('エクササイズ') || lowerMessage.includes('ワークアウト')) {
    return {
      message: `${userName}さん、運動について素晴らしいですね！💪 定期的な運動は心身の健康に欠かせません。どんな運動がお好みですか？`,
      mood: 'excited' as const,
      confidence: 0.9,
      topics: ['運動', 'フィットネス'],
      intent: 'exercise_support',
      responseTime,
      tokens: 0,
      model: 'fallback-health-assistant'
    };
  }

  if (lowerMessage.includes('気分') || lowerMessage.includes('ストレス') || lowerMessage.includes('疲れ')) {
    return {
      message: `${userName}さん、お疲れ様です。心の健康も体の健康と同じくらい大切ですね。😌 深呼吸をして、リラックスする時間を作ってみてください。`,
      mood: 'neutral' as const,
      confidence: 0.8,
      topics: ['メンタルヘルス', 'ストレス管理'],
      intent: 'mental_health_support',
      responseTime,
      tokens: 0,
      model: 'fallback-health-assistant'
    };
  }

  if (lowerMessage.includes('睡眠') || lowerMessage.includes('寝る') || lowerMessage.includes('眠い')) {
    return {
      message: `${userName}さん、良質な睡眠は健康の要です！😴 7-8時間の睡眠を心がけて、規則正しい生活リズムを保ちましょう。`,
      mood: 'happy' as const,
      confidence: 0.9,
      topics: ['睡眠', '生活リズム'],
      intent: 'sleep_guidance',
      responseTime,
      tokens: 0,
      model: 'fallback-health-assistant'
    };
  }

  if (lowerMessage.includes('水') || lowerMessage.includes('水分')) {
    return {
      message: `${userName}さん、水分補給について！💧 1日に1.5-2リットルの水を飲むことが推奨されています。こまめな水分補給で健康維持しましょう！`,
      mood: 'happy' as const,
      confidence: 0.9,
      topics: ['水分補給', 'ヘルスケア'],
      intent: 'hydration_guidance',
      responseTime,
      tokens: 0,
      model: 'fallback-health-assistant'
    };
  }

  if (lowerMessage.includes('こんにちは') || lowerMessage.includes('おはよう') || lowerMessage.includes('こんばんは')) {
    const timeGreeting = getTimeBasedGreeting();
    return {
      message: `${timeGreeting}${userName}さん！今日も健康管理頑張りましょう！✨ 何かお手伝いできることがあれば、遠慮なくお聞かせください。`,
      mood: 'happy' as const,
      confidence: 0.9,
      topics: ['挨拶'],
      intent: 'greeting',
      responseTime,
      tokens: 0,
      model: 'fallback-health-assistant'
    };
  }

  if (lowerMessage.includes('ありがとう') || lowerMessage.includes('感謝')) {
    return {
      message: `${userName}さん、どういたしまして！😊 あなたの健康をサポートできて嬉しいです。一緒に頑張りましょう！`,
      mood: 'happy' as const,
      confidence: 0.9,
      topics: ['感謝'],
      intent: 'appreciation',
      responseTime,
      tokens: 0,
      model: 'fallback-health-assistant'
    };
  }

  // Default response
  return {
    message: `${userName}さん、お話しいただきありがとうございます！🌟 健康に関することでしたら何でもお聞かせください。体重記録、食事管理、運動について一緒に考えていきましょう！`,
    mood: 'happy' as const,
    confidence: 0.7,
    topics: topics.length > 0 ? topics : ['一般的な健康支援'],
    intent: 'general_health_support',
    responseTime,
    tokens: 0,
    model: 'fallback-health-assistant'
  };
}

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  
  if (hour < 12) {
    return 'おはようございます！';
  } else if (hour < 18) {
    return 'こんにちは！';
  } else {
    return 'こんばんは！';
  }
}

// Test endpoint for OpenAI service (development only)
router.get('/status', async (req: any, res) => {
  res.json({
    openai_service_available: !!openaiService,
    openai_init_error: openaiInitError,
    environment: process.env.NODE_ENV,
    has_api_key: !!process.env.OPENAI_API_KEY,
    api_key_configured: process.env.OPENAI_API_KEY !== 'your_openai_api_key_here',
    setup_instructions: !openaiService ? {
      step1: 'Get API key from https://platform.openai.com/api-keys',
      step2: 'Create .env file in project root',
      step3: 'Add: OPENAI_API_KEY=sk-your-actual-key-here',
      step4: 'Restart the server'
    } : null
  });
});


export default router;