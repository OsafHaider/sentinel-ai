export function Header() {
  return (
    <header className="px-6 py-5 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md z-10 flex items-center justify-between sticky top-0">
      <div className="flex items-center gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_12px_rgba(59,130,246,0.6)]"></div>
        <div>
          <h1 className="text-sm font-bold tracking-widest uppercase text-slate-300">
            Sentinel <span className="text-blue-400">AI</span>
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">v1.2 Ready</p>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
        <span className="text-[10px] font-semibold text-emerald-400 uppercase">Active</span>
      </div>
    </header>
  );
}
