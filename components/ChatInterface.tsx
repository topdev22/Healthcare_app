import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Volume2, VolumeX, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatBubble } from '@/components/ui/chat-bubble';
import { ttsService } from '@/lib/ttsService';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'character';
  timestamp: Date;
  healthDataExtracted?: boolean;
  extractedData?: any;
}

interface ChatInterfaceProps {
  onSendMessage: (message: string) => void;
  messages: Message[];
  isLoading?: boolean;
  characterName?: string;
}

export default function ChatInterface({ 
  onSendMessage, 
  messages, 
  isLoading = false,
  characterName = "HealthBuddy"
}: ChatInterfaceProps) {
  const [inputMessage, setInputMessage] = useState('');
  const [isTTSEnabled, setIsTTSEnabled] = useState(ttsService.isEnabled());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Smooth scroll to bottom on new messages or loading, isolated to chat container
  // Note: Page-level scroll jumps may occur due to layout shifts from triggerCharacterRefresh() in useChat.ts
  // dispatching storage events, re-rendering Character component in Index.tsx
  const previousMessageCountRef = useRef(messages.length);
  useEffect(() => {
    const previousCount = previousMessageCountRef.current;
    if (messages.length > previousCount || isLoading) {
      // Use requestAnimationFrame for smooth scroll after DOM update
      const rafId = requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
      return () => cancelAnimationFrame(rafId);
    }
    previousMessageCountRef.current = messages.length;
  }, [messages.length, isLoading]);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isLoading || messages.length === 0 || isNearBottom) {
        container.scrollTop = container.scrollHeight;
      }
    }
  };


  // Sync component state with TTS service state on mount
  useEffect(() => {
    setIsTTSEnabled(ttsService.isEnabled());
  }, []);

  // Cleanup: stop TTS when component unmounts
  useEffect(() => {
    return () => {
      ttsService.stop();
    };
  }, []);

  const handleSendMessage = () => {
    if (inputMessage.trim() && !isLoading) {
      onSendMessage(inputMessage.trim());
      setInputMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const speakMessage = async (text: string) => {
    if (isTTSEnabled) {
      try {
        await ttsService.speak(text);
      } catch (error) {
        console.error('TTS error:', error);
        // For interrupted errors, don't show as an error to user since it's expected behavior
        if (error instanceof Error && error.message.includes('interrupted')) {
          console.log('TTS was interrupted (this is normal when switching between messages)');
        } else {
          console.warn('TTS failed:', error);
        }
      }
    }
  };



  return (
    <div className="h-full flex flex-col glass rounded-xl border border-white/30 shadow-xl overflow-hidden" style={{ contain: 'layout style' }}>
      {/* Chat Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-white/20 bg-gradient-to-r from-character-primary/5 to-character-secondary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-character-primary to-character-secondary flex items-center justify-center shadow-lg">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-lg">{characterName}とチャット</h3>
              <p className="text-xs text-muted-foreground">健康に関するご質問をどうぞ</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newState = !isTTSEnabled;
              setIsTTSEnabled(newState);
              ttsService.setEnabled(newState);
            }}
            className="glass border border-white/20 hover:bg-white/20"
          >
            {isTTSEnabled ? (
              <Volume2 className="w-4 h-4 text-health-green" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col min-h-[500px] lg:min-h-[400px] max-h-[500px] lg:max-h-[600px] overflow-hidden">
        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto space-y-4 px-4 sm:px-6 py-4"
          style={{ scrollBehavior: 'auto' }}
        >
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-character-primary/20 to-character-secondary/20 flex items-center justify-center mx-auto">
                <MessageCircle className="w-8 h-8 text-character-primary" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground mb-2">健康バディとお話ししませんか？</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  健康目標や今日の体調について、<br />
                  お気軽にお話しください。
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-6">
                {/* <Button variant="outline" size="sm" onClick={() => setInputMessage("今日の体調はどうですか？")}>
                  体調について
                </Button> */}
                <Button variant="outline" size="sm" onClick={() => setInputMessage("健康的な食事のアドバイスをください")}>
                  食事相談
                </Button>
                <Button variant="outline" size="sm" onClick={() => setInputMessage("運動習慣を始めたいです")}>
                  運動相談
                </Button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <ChatBubble
                key={message.id}
                content={message.content}
                sender={message.sender}
                timestamp={message.timestamp}
                healthDataExtracted={message.healthDataExtracted}
                extractedData={message.extractedData}
                onSpeak={message.sender === 'character' ? () => speakMessage(message.content) : undefined}
                enableStreaming={message.sender === 'character'}
              />
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="relative max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-3 glass border border-white/30 shadow-lg rounded-bl-md">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-character-primary to-character-secondary flex items-center justify-center shadow-sm">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-character-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-character-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-character-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm font-medium">{characterName}が考えています...</span>
                  </div>
                </div>
                {/* Bubble tail */}
                <div className="absolute left-0 bottom-0 w-3 h-3 border-8 border-transparent border-r-white/20 border-b-white/20 border-r-8 border-b-8 transform -translate-x-1 translate-y-1" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Enhanced Input Area */}
        <div className="px-4 sm:px-6 py-4 border-t border-white/20 bg-gradient-to-r from-white/5 to-white/10">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="健康について何でもお聞きください..."
                disabled={isLoading}
                className="pr-12 glass border-white/30 bg-white/50 focus:bg-white/70 transition-all duration-300"
              />
              {inputMessage && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setInputMessage('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 p-0 hover:bg-white/20"
                >
                  ×
                </Button>
              )}
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-gradient-to-r from-health-green to-health-blue hover:from-health-green/90 hover:to-health-blue/90 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              size="lg"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => setInputMessage("今日の健康状態を教えて")}
              className="glass border-white/30 hover:bg-white/20 text-xs"
            >
              今日の体調
            </Button> */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputMessage("食事のアドバイスをください")}
              className="glass border-white/30 hover:bg-white/20 text-xs"
            >
              食事相談
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputMessage("運動の提案をお願いします")}
              className="glass border-white/30 hover:bg-white/20 text-xs"
            >
              運動提案
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
