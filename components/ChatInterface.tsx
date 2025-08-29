import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Volume2, VolumeX } from 'lucide-react';
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

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is updated before scrolling
    const rafId = requestAnimationFrame(() => {
      scrollToBottom();
    });

    return () => cancelAnimationFrame(rafId);
  }, [messages]);

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
        console.log('Starting TTS for:', text.substring(0, 50) + '...');
        await ttsService.speak(text);
        console.log('TTS completed successfully');
      } catch (error) {
        console.error('TTS error:', error);
        // For interrupted errors, don't show as an error to user since it's expected behavior
        if (error instanceof Error && error.message.includes('interrupted')) {
          console.log('TTS was interrupted (this is normal when switching between messages)');
        } else {
          console.warn('TTS failed:', error);
          // Optionally show user feedback about TTS failure here
        }
      }
    }
  };



  return (
    <div className="h-full flex flex-col bg-background/50 rounded-lg border border-border/50" style={{ contain: 'layout style' }}>
      <div className="pb-3 px-4 pt-4 border-b border-border/50">
        <div className="text-lg flex items-center justify-between">
          <span className="font-semibold text-foreground">{characterName}とチャット</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newState = !isTTSEnabled;
              setIsTTSEnabled(newState);
              ttsService.setEnabled(newState);
            }}
            className="p-2"
          >
            {isTTSEnabled ? (
              <Volume2 className="w-4 h-4 text-health-green" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col p-2 space-y-4 min-h-[300px] lg:min-h-[400px] max-h-[400px] lg:max-h-[500px] overflow-hidden">
        {/* Messages Area */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto space-y-4 px-2 py-4"
          style={{ scrollBehavior: 'auto' }}
        >
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>健康バディとの会話を始めましょう！</p>
              <p className="text-sm mt-2">健康目標や今日の体調について話してみてください。</p>
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
              <div className="relative max-w-[85%] lg:max-w-[75%] rounded-2xl px-4 py-3 bg-muted text-muted-foreground border border-border/50 shadow-sm rounded-bl-md">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm">{characterName}が考えています...</span>
                </div>
                {/* Bubble tail */}
                <div className="absolute left-0 bottom-0 w-3 h-3 border-8 border-transparent border-r-muted border-b-muted border-r-8 border-b-8 transform -translate-x-1 translate-y-1" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex gap-2 pt-3 border-t">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="メッセージを入力してください..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            size="sm"
            className="px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
