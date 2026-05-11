"use client";
import { Send, Paperclip, Loader2 } from "lucide-react";
import { useRef } from "react";

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onFileSelect: (files: FileList | null) => void;
}

export function ChatInput({
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onFileSelect,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="px-4 pb-4">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={onSubmit} className="flex gap-3 items-end">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
            title="Attach file"
          >
            <Paperclip size={20} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.txt,.doc,.docx"
            onChange={(e) => onFileSelect(e.target.files)}
          />

          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                  onSubmit(e as unknown as React.FormEvent);
                }
              }}
              placeholder="Ask Sentinel anything..."
              disabled={isLoading}
              className="w-full bg-slate-900/60 border border-slate-700/50 hover:border-slate-600/50 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 px-5 py-3.5 rounded-xl text-sm transition-all outline-none disabled:opacity-50 placeholder-slate-600 backdrop-blur-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl transition-all disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 disabled:shadow-none"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest pt-4">
          Protected by Sentinel Guardrails • End-to-End Encrypted
        </p>
      </div>
    </div>
  );
}
