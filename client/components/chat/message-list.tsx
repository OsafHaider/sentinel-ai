"use client";
import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { Bot } from "lucide-react";

interface Message {
  role: string;
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div id="chat-screen" className="flex-1 overflow-y-auto px-4 py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.length === 0 && !isLoading && (
          <div className="h-[65vh] flex flex-col items-center justify-center text-center">
            <div className="p-4 rounded-2xl bg-linear-to-br from-blue-500/10 to-emerald-500/10 border border-blue-500/20 mb-6">
              <Bot className="w-10 h-10 text-blue-400 mx-auto" />
            </div>
            <h2 className="text-3xl font-semibold text-white mb-2">System Online</h2>
            <p className="text-slate-400 max-w-sm leading-relaxed">
              Sentinel-AI is ready for high-speed processing and intelligent caching.
            </p>
          </div>
        )}

        {messages.map((message, idx) => (
          <MessageBubble
            key={idx}
            role={message.role as "user" | "assistant"}
            content={message.content}
          />
        ))}

        {isLoading && (
          <MessageBubble role="assistant" content="" isLoading={true} />
        )}

        <div ref={scrollRef} />
      </div>
    </div>
  );
}
