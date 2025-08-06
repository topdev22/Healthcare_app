import express from 'express';
import { authenticateToken } from '../middleware/auth';
import ChatMessage from '../models/ChatMessage';
import Conversation from '../models/Conversation';
import { User } from '../models/User';
import { 
  validateChatMessage, 
  validateConversation,
  sanitizeChatMessage, 
  sanitizeConversation 
} from '../utils/validation';

const router = express.Router();

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

    // Generate AI response
    const startTime = Date.now();
    const aiResponseData = generateHealthResponse(sanitizedMessage.content, userContext);
    const responseTime = Date.now() - startTime;

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
        responseTime,
        model: 'health-assistant-v1'
      },
      metadata: {
        topics: aiResponseData.topics || extractTopics(aiResponseData.message),
        intent: aiResponseData.intent || 'general_health_support'
      }
    });
    await aiMessage.save();

    // Update conversation with latest activity
    await Conversation.findByIdAndUpdate(conversation._id, {
      lastMessageAt: new Date(),
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
      metadata: {
        responseTime,
        topics: aiResponseData.topics
      }
    });
  } catch (error) {
    console.error('Chat message error:', error);
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

// Enhanced health-focused response generator
function generateHealthResponse(message: string, userContext: any) {
  const lowerMessage = message.toLowerCase();
  const userName = userContext?.displayName || 'あなた';
  const topics = extractTopics(message);
  
  // Health-related keywords and responses
  if (lowerMessage.includes('体重') || lowerMessage.includes('weight')) {
    return {
      message: `${userName}さん、体重管理についてお聞かせください！定期的な計測は健康管理の基本ですね。目標体重はありますか？🏃‍♀️`,
      mood: 'happy' as const,
      confidence: 0.9,
      topics: ['体重管理'],
      intent: 'weight_management'
    };
  }

  if (lowerMessage.includes('食事') || lowerMessage.includes('食べ') || lowerMessage.includes('料理')) {
    return {
      message: `${userName}さん、食事について話しましょう！バランスの良い食事は健康の基盤です。今日は何を食べましたか？写真を撮って記録してみませんか？📸🥗`,
      mood: 'excited' as const,
      confidence: 0.9,
      topics: ['食事', '栄養'],
      intent: 'nutrition_guidance'
    };
  }

  if (lowerMessage.includes('運動') || lowerMessage.includes('エクササイズ') || lowerMessage.includes('ワークアウト')) {
    return {
      message: `${userName}さん、運動について素晴らしいですね！💪 定期的な運動は心身の健康に欠かせません。どんな運動がお好みですか？`,
      mood: 'excited' as const,
      confidence: 0.9,
      topics: ['運動', 'フィットネス'],
      intent: 'exercise_support'
    };
  }

  if (lowerMessage.includes('気分') || lowerMessage.includes('ストレス') || lowerMessage.includes('疲れ')) {
    return {
      message: `${userName}さん、お疲れ様です。心の健康も体の健康と同じくらい大切ですね。😌 深呼吸をして、リラックスする時間を作ってみてください。`,
      mood: 'neutral' as const,
      confidence: 0.8,
      topics: ['メンタルヘルス', 'ストレス管理'],
      intent: 'mental_health_support'
    };
  }

  if (lowerMessage.includes('睡眠') || lowerMessage.includes('寝る') || lowerMessage.includes('眠い')) {
    return {
      message: `${userName}さん、良質な睡眠は健康の要です！😴 7-8時間の睡眠を心がけて、規則正しい生活リズムを保ちましょう。`,
      mood: 'happy' as const,
      confidence: 0.9,
      topics: ['睡眠', '生活リズム'],
      intent: 'sleep_guidance'
    };
  }

  if (lowerMessage.includes('水') || lowerMessage.includes('水分')) {
    return {
      message: `${userName}さん、水分補給について！💧 1日に1.5-2リットルの水を飲むことが推奨されています。こまめな水分補給で健康維持しましょう！`,
      mood: 'happy' as const,
      confidence: 0.9,
      topics: ['水分補給', 'ヘルスケア'],
      intent: 'hydration_guidance'
    };
  }

  if (lowerMessage.includes('こんにちは') || lowerMessage.includes('おはよう') || lowerMessage.includes('こんばんは')) {
    const timeGreeting = getTimeBasedGreeting();
    return {
      message: `${timeGreeting}${userName}さん！今日も健康管理頑張りましょう！✨ 何かお手伝いできることがあれば、遠慮なくお聞かせください。`,
      mood: 'happy' as const,
      confidence: 0.9,
      topics: ['挨拶'],
      intent: 'greeting'
    };
  }

  if (lowerMessage.includes('ありがとう') || lowerMessage.includes('感謝')) {
    return {
      message: `${userName}さん、どういたしまして！😊 あなたの健康をサポートできて嬉しいです。一緒に頑張りましょう！`,
      mood: 'happy' as const,
      confidence: 0.9,
      topics: ['感謝'],
      intent: 'appreciation'
    };
  }

  // Default response
  return {
    message: `${userName}さん、お話しいただきありがとうございます！🌟 健康に関することでしたら何でもお聞かせください。体重記録、食事管理、運動について一緒に考えていきましょう！`,
    mood: 'happy' as const,
    confidence: 0.7,
    topics: topics.length > 0 ? topics : ['一般的な健康支援'],
    intent: 'general_health_support'
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

export default router;