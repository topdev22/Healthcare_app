import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      
      <CardContent className="flex-1 flex flex-col p-4 space-y-4 h-[800px] overflow-y-auto">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>健康バディとの会話を始めましょう！</p>
              <p className="text-sm mt-2">健康目標や今日の体調について話してみてください。</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-3 text-sm",
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground border'
                  )}
                >
                  <p>{message.content}</p>
                  <p className={cn(
                    "text-xs mt-1 opacity-70",
                    message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                  )}>
                    {formatTime(message.timestamp)}
                  </p>
                  
                  {message.healthDataExtracted && (
                    <div className="text-xs mt-2 p-2 bg-green-100 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                      <p className="text-green-700 dark:text-green-300 font-medium">
                        📊 健康データを自動記録しました！
                      </p>
                      {message.extractedData && (
                        <div className="mt-1 text-green-600 dark:text-green-400 text-xs">
                          {Object.entries(message.extractedData).map(([key, value]: [string, any]) => (
                            <span key={key} className="inline-block mr-2">
                              {key}: {Array.isArray(value) ? value.join(', ') : value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {message.sender === 'character' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => speakMessage(message.content)}
                      className="mt-1 p-1 h-auto opacity-50 hover:opacity-100"
                    >
                      <Volume2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 text-sm text-muted-foreground border">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>{characterName}が考えています...</span>
                </div>
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
