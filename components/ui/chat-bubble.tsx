import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Volume2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";

interface ChatBubbleProps {
  content: string;
  sender: "user" | "character";
  timestamp: Date;
  healthDataExtracted?: boolean;
  extractedData?: any;
  onSpeak?: () => void;
  className?: string;
  enableStreaming?: boolean;
  avatarAlt?: string;
}

interface TextSegment {
  text: string;
  type: "normal" | "bold" | "italic" | "code";
}

// Function to parse text with markdown-like formatting
function parseMarkdown(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    // Look for bold text **text**
    const boldMatch = text.substring(currentIndex).match(/^\*\*(.*?)\*\*/);
    if (boldMatch) {
      segments.push({ text: boldMatch[1], type: "bold" });
      currentIndex += boldMatch[0].length;
      continue;
    }

    // Look for italic text *text* (but not if it's part of **)
    const italicMatch = text
      .substring(currentIndex)
      .match(/^(?<!\*)\*([^*]+?)\*(?!\*)/);
    if (italicMatch) {
      segments.push({ text: italicMatch[1], type: "italic" });
      currentIndex += italicMatch[0].length;
      continue;
    }

    // Look for inline code `text`
    const codeMatch = text.substring(currentIndex).match(/^`([^`]+?)`/);
    if (codeMatch) {
      segments.push({ text: codeMatch[1], type: "code" });
      currentIndex += codeMatch[0].length;
      continue;
    }

    // Regular text - find the next special character or end of string
    let nextSpecialIndex = text.length;
    const specialChars = [
      text.indexOf("**", currentIndex),
      text.indexOf("*", currentIndex),
      text.indexOf("`", currentIndex),
    ];

    for (const index of specialChars) {
      if (index !== -1 && index < nextSpecialIndex) {
        nextSpecialIndex = index;
      }
    }

    if (nextSpecialIndex > currentIndex) {
      segments.push({
        text: text.substring(currentIndex, nextSpecialIndex),
        type: "normal",
      });
      currentIndex = nextSpecialIndex;
    } else {
      // No more special characters, add rest of text
      segments.push({
        text: text.substring(currentIndex),
        type: "normal",
      });
      break;
    }
  }

  return segments;
}

// Function to render formatted text segments
function renderFormattedText(segments: TextSegment[]): React.ReactNode {
  return segments.map((segment, index) => {
    switch (segment.type) {
      case "bold":
        return (
          <strong key={index} className="font-bold">
            {segment.text}
          </strong>
        );
      case "italic":
        return (
          <em key={index} className="italic">
            {segment.text}
          </em>
        );
      case "code":
        return (
          <code
            key={index}
            className="bg-muted/50 text-foreground px-1 py-0.5 rounded text-xs font-mono border"
          >
            {segment.text}
          </code>
        );
      default:
        return segment.text;
    }
  });
}

export function ChatBubble({
  content,
  sender,
  timestamp,
  healthDataExtracted = false,
  extractedData,
  onSpeak,
  className,
  enableStreaming = true,
  avatarAlt,
}: ChatBubbleProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const isUser = sender === "user";

  // Character streaming effect (like Cursor chat)
  useEffect(() => {
    if (!enableStreaming || isUser) {
      setDisplayedContent(content);
      return;
    }

    setIsStreaming(true);
    setDisplayedContent("");

    const characters = content.split("");
    const totalDuration = 1500; // 1.5 seconds for full message
    const interval = totalDuration / characters.length;

    let currentIndex = 0;

    const streamInterval = setInterval(() => {
      if (currentIndex < characters.length) {
        setDisplayedContent(characters.slice(0, currentIndex + 1).join(""));
        currentIndex++;
      } else {
        clearInterval(streamInterval);
        setIsStreaming(false);
      }
    }, interval);

    return () => {
      clearInterval(streamInterval);
      setIsStreaming(false);
    };
  }, [content, enableStreaming, isUser]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Avatar component
  const AvatarComponent = () => {
    // Safe localStorage access to prevent SSR issues
    const getUserData = () => {
      if (typeof window !== "undefined") {
        try {
          return JSON.parse(localStorage.getItem("auth_user") || "{}");
        } catch (error) {
          console.error("Error parsing user data from localStorage:", error);
          return {};
        }
      }
      return {};
    };

    const user = getUserData();
    return (
      <Avatar className="w-8 h-8">
        <AvatarImage
          src={
            isUser
              ? user.photoURL || "https://hapiken.jp/profile/defaultUser.png"
              : "/images/favicon.jpg"
          }
          alt={avatarAlt || `${sender} avatar`}
          className="object-cover"
        />
        <AvatarFallback>{isUser ? "U" : "C"}</AvatarFallback>
      </Avatar>
    );
  };

  return (
    <div
      className={cn(
        "flex w-full gap-0 items-end min-h-[150px]",
        isUser ? "justify-end" : "justify-start",
        className,
      )}
    >
      {/* Avatar for character messages */}
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <AvatarComponent />
        </div>
      )}

      <div
        className={cn(
          "relative max-w-[85%] lg:max-w-[75%]",
          "rounded-2xl px-4 py-3",
          "shadow-sm border",
          "transition-all duration-200 ease-in-out",
          "hover:shadow-md",
          "mb-4",
          isUser
            ? [
                "bg-primary text-primary-foreground",
                "rounded-br-md",
                "border-primary/20",
                "shadow-primary/10",
              ]
            : [
                "bg-muted text-muted-foreground",
                "rounded-bl-md",
                "border-border/50",
                "shadow-muted/10",
              ],
        )}
      >
        {/* Message content */}
        <div className="space-y-2">
          <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {renderFormattedText(parseMarkdown(displayedContent))}
            {/* {isStreaming && (
              <span className="inline-block w-2 h-4 bg-current ml-1 animate-pulse" />
            )} */}
          </div>

          {/* Timestamp */}
          <p
            className={cn(
              "text-xs opacity-70",
              isUser
                ? "text-primary-foreground/70"
                : "text-muted-foreground/70",
            )}
          >
            {formatTime(timestamp)}
          </p>
        </div>

        {/* Health data extraction notification */}
        {healthDataExtracted && !isStreaming && (
          <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-green-700 dark:text-green-300 font-medium text-xs">
              📊 健康データを自動記録しました！
            </p>
            {extractedData && (
              <div className="mt-1 text-green-600 dark:text-green-400 text-xs">
                {Object.entries(extractedData).map(
                  ([key, value]: [string, any]) => (
                    <span key={key} className="inline-block mr-2">
                      {key}: {Array.isArray(value) ? value.join(", ") : value}
                    </span>
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {/* Speak button for character messages */}
        {!isUser && onSpeak && !isStreaming && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onSpeak}
            className={cn(
              "absolute -bottom-2 -right-2",
              "w-6 h-6 rounded-full p-0",
              "bg-background border border-border",
              "opacity-60 hover:opacity-100",
              "transition-opacity duration-200",
              "shadow-sm hover:shadow-md",
            )}
          >
            <Volume2 className="w-3 h-3" />
          </Button>
        )}

        {/* Bubble tail */}
        <div
          className={cn(
            "absolute w-3 h-3",
            "border-8 border-transparent",
            isUser
              ? [
                  "right-0 bottom-0",
                  "border-l-primary border-b-primary",
                  "border-l-8 border-b-8",
                  "transform translate-x-1 translate-y-1",
                ]
              : [
                  "left-0 bottom-0",
                  "border-r-muted border-b-muted",
                  "border-r-8 border-b-8",
                  "transform -translate-x-1 translate-y-1",
                ],
          )}
        />
      </div>

      {/* Avatar for user messages */}
      {isUser && (
        <div className="flex-shrink-0 mt-1">
          <AvatarComponent />
        </div>
      )}
    </div>
  );
}
