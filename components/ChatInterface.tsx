import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatBubble } from '@/components/ui/chat-bubble';

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
  const [isTTSEnabled, setIsTTSEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window && isTTSEnabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.voice = speechSynthesis.getVoices().find(voice => voice.name.includes('female')) || null;
      speechSynthesis.speak(utterance);
    }
  };



  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Chat with {characterName}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTTSEnabled(!isTTSEnabled)}
            className="p-2"
          >
            {isTTSEnabled ? (
              <Volume2 className="w-4 h-4 text-health-green" />
            ) : (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-2 space-y-4 h-[1100px] overflow-y-auto">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-4 px-2 py-4 h-[1000px]">
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
      </CardContent>
    </Card>
  );
}
