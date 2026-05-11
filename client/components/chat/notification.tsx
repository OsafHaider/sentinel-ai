"use client";
import { ShieldCheck, X } from "lucide-react";

interface NotificationProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

export function Notification({ message, show, onClose }: NotificationProps) {
  if (!show) return null;

  return (
    <div className="fixed top-24 right-6 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="bg-emerald-500/10 border border-emerald-500/40 backdrop-blur-md p-4 rounded-xl flex items-center gap-3 shadow-[0_0_24px_rgba(16,185,129,0.15)] hover:border-emerald-500/60 transition-colors">
        <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
          <ShieldCheck className="text-emerald-400 w-4 h-4" />
        </div>
        <p className="text-sm font-medium text-emerald-200 leading-relaxed">
          {message}
        </p>
        <button
          onClick={onClose}
          className="ml-2 p-1 text-emerald-500/50 hover:text-emerald-400 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
