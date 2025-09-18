import { useState } from 'react';
import { chatAPI } from '@/lib/api';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'character';
  timestamp: Date;
  healthDataExtracted?: boolean;
  extractedData?: any;
  animation?: string;
}

export function useChat(userProfile: any) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "こんにちは！私はあなたの健康管理パートナーです！🌟 今日の体調はいかがですか？あなたの健康な生活をサポートするためにここにいます！",
      sender: 'character',
      timestamp: new Date()
    }
  ]);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string>('greeting');

  const triggerHaptics = async (style: ImpactStyle = ImpactStyle.Medium) => {
    try {
      if (window.Capacitor && window.Capacitor.isNativePlatform()) {
        await Haptics.impact({ style });
      }
    } catch (error) {
      // Silently ignore if haptics not available
    }
  };

  const handleSendMessage = async (message: string) => {
    await triggerHaptics(ImpactStyle.Light);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoadingResponse(true);

    try {
      const response = await chatAPI.sendMessage(message, userProfile);
      
      const characterResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        sender: 'character',
        timestamp: new Date(),
        healthDataExtracted: response.healthDataExtracted,
        extractedData: response.extractedHealthData,
        animation: response.animation
      };
      
      setMessages(prev => [...prev, characterResponse]);
      
      // Update animation if provided in response
      if (response.animation) {
        setCurrentAnimation(response.animation);
        console.log('🎭 Animation updated to:', response.animation);
      }
      
      await triggerHaptics(ImpactStyle.Light);

      // Always trigger character data refresh for chat activity (experience gain)
      // console.log('💬 Chat interaction completed, refreshing character data for experience...');
      
      // Show additional feedback if health data was extracted
      if (response.healthDataExtracted) {
        console.log('🎯 Health data also extracted from chat!');
      }
    } catch (error) {
      console.error('チャットエラー:', error);
      
      const userContext = userProfile ? `${userProfile.displayName}さん` : 'あなた';
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: `${userContext}、申し訳ございません。現在サーバーに接続できません。しばらく時間をおいてから再度お試しください。`,
        sender: 'character',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsLoadingResponse(false);
    }
  };

  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  return {
    messages,
    isLoadingResponse,
    currentAnimation,
    handleSendMessage,
    addMessage,
    triggerHaptics
  };
}