"use client";
import { Bot, User } from "lucide-react";
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  isLoading?: boolean;
}

export function MessageBubble({ role, content, isLoading }: MessageBubbleProps) {
  const isUser = role === "user";

  if (isLoading) {
    return (
      <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
          </div>
          <div className="flex gap-1 items-center bg-slate-900/60 backdrop-blur-sm border border-slate-800/50 px-5 py-3 rounded-2xl rounded-tl-none">
            <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse"></div>
            <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse delay-100"></div>
            <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
          isUser 
            ? "bg-blue-600/10 border-blue-500/30" 
            : "bg-slate-800 border-slate-700"
        }`}>
          {isUser ? (
            <User size={16} className="text-blue-400" />
          ) : (
            <Bot size={16} className="text-slate-400" />
          )}
        </div>
        <div
          className={`px-5 py-3 rounded-2xl leading-relaxed text-[15px] shadow-sm backdrop-blur-sm ${
            isUser
              ? "bg-blue-600 text-white rounded-br-none"
              : "bg-slate-900/60 border border-slate-800/50 text-slate-100 rounded-bl-none"
          }`}
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                
          {content}
            </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
