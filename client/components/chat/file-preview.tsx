"use client";
import { File as FileIcon, X } from "lucide-react";

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  file: File;
}

interface FilePreviewProps {
  file: UploadedFile | null;
  isIngesting: boolean;
  onRemove: () => void;
  onIngest: () => void;
}

export function FilePreview({ file, isIngesting, onRemove, onIngest }: FilePreviewProps) {
  if (!file) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="animate-in zoom-in-95 fade-in duration-200 p-4 bg-linear-to-r from-slate-900/50 to-slate-800/30 border border-slate-700/50 rounded-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <FileIcon className="text-blue-400" size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-200 truncate">{file.name}</p>
            <p className="text-xs text-slate-500 uppercase tracking-wider mt-1">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onIngest}
            disabled={isIngesting}
            className="px-4 py-2 text-sm font-semibold bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
          >
            {isIngesting ? (
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Ingesting...
              </span>
            ) : (
              "Teach Sentinel"
            )}
          </button>
          <button
            onClick={onRemove}
            disabled={isIngesting}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
