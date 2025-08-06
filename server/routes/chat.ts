import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Send chat message and get AI response
router.post('/message', authenticateToken, async (req: any, res) => {
  try {
    const { message, userContext } = req.body;
    const userId = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    console.log('Chat message from user:', userId, 'message:', message);

    // For now, let's create a simple response system
    // In a real implementation, you would integrate with:
    // - OpenAI GPT API
    // - Google Bard
    // - Anthropic Claude
    // - Or your custom AI model

    const responses = generateHealthResponse(message, userContext);

    res.json({
      success: true,
      message: responses.message,
      mood: responses.mood || 'happy'
    });
  } catch (error) {
    console.error('Chat message error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get chat history (placeholder)
router.get('/history', authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user._id;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    console.log('Getting chat history for user:', userId);

    // Placeholder implementation
    // In a real app, you'd store chat messages in the database
    res.json({
      success: true,
      data: [],
      pagination: {
        total: 0,
        limit,
        offset,
        hasMore: false
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Simple health-focused response generator
function generateHealthResponse(message: string, userContext: any) {
  const lowerMessage = message.toLowerCase();
  const userName = userContext?.displayName || 'あなた';

  // Health-related keywords and responses
  if (lowerMessage.includes('体重') || lowerMessage.includes('weight')) {
    return {
      message: `${userName}さん、体重管理についてお聞かせください！定期的な計測は健康管理の基本ですね。目標体重はありますか？🏃‍♀️`,
      mood: 'happy'
    };
  }

  if (lowerMessage.includes('食事') || lowerMessage.includes('食べ') || lowerMessage.includes('料理')) {
    return {
      message: `${userName}さん、食事について話しましょう！バランスの良い食事は健康の基盤です。今日は何を食べましたか？写真を撮って記録してみませんか？📸🥗`,
      mood: 'excited'
    };
  }

  if (lowerMessage.includes('運動') || lowerMessage.includes('エクササイズ') || lowerMessage.includes('ワークアウト')) {
    return {
      message: `${userName}さん、運動について素晴らしいですね！💪 定期的な運動は心身の健康に欠かせません。どんな運動がお好みですか？`,
      mood: 'excited'
    };
  }

  if (lowerMessage.includes('気分') || lowerMessage.includes('ストレス') || lowerMessage.includes('疲れ')) {
    return {
      message: `${userName}さん、お疲れ様です。心の健康も体の健康と同じくらい大切ですね。😌 深呼吸をして、リラックスする時間を作ってみてください。`,
      mood: 'neutral'
    };
  }

  if (lowerMessage.includes('睡眠') || lowerMessage.includes('寝る') || lowerMessage.includes('眠い')) {
    return {
      message: `${userName}さん、良質な睡眠は健康の要です！😴 7-8時間の睡眠を心がけて、規則正しい生活リズムを保ちましょう。`,
      mood: 'happy'
    };
  }

  if (lowerMessage.includes('こんにちは') || lowerMessage.includes('おはよう') || lowerMessage.includes('こんばんは')) {
    const timeGreeting = getTimeBasedGreeting();
    return {
      message: `${timeGreeting}${userName}さん！今日も健康管理頑張りましょう！✨ 何かお手伝いできることがあれば、遠慮なくお聞かせください。`,
      mood: 'happy'
    };
  }

  if (lowerMessage.includes('ありがとう') || lowerMessage.includes('感謝')) {
    return {
      message: `${userName}さん、どういたしまして！😊 あなたの健康をサポートできて嬉しいです。一緒に頑張りましょう！`,
      mood: 'happy'
    };
  }

  // Default response
  return {
    message: `${userName}さん、お話しいただきありがとうございます！🌟 健康に関することでしたら何でもお聞かせください。体重記録、食事管理、運動について一緒に考えていきましょう！`,
    mood: 'happy'
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