"use client";
import React, { useEffect, useState } from "react";
import {
  Activity,
  Zap,
  Database,
  DollarSign,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Header } from "@/components/header";
import StatCard from "@/components/stats-card";

export default function SentinelDashboard() {
  const [stats, setStats] = useState({
    t1: 0,
    t2: 0,
    misses: 0,
    blocks: 0,
    savings: "0.0000",
    files: 0,
    latency: "0",
    timestamp: "--:--:--",
  });

  useEffect(() => {
    const es = new EventSource(
      `http://localhost:8008/api/v1/chat/stats/stream`,
      {
        withCredentials: true,
      },
    );

    console.log("⏳ SSE Connection Attempting...");

    es.onmessage = (event) => {
      try {
        console.log("📥 SSE Data Received:", event.data);
        const data = JSON.parse(event.data);

        setStats({
          t1: data.t1 || 0,
          t2: data.t2 || 0,
          misses: data.misses || 0,
          blocks: data.blocks || 0,
          savings: data.savings || "0.0000",
          files: data.files || 0,  
          latency: data.latency || "0", 
          timestamp: data.timestamp || "--:--:--",
        });
      } catch (err) {
        console.error("❌ Error parsing SSE data:", err);
      }
    };

    es.onopen = () => {
      console.log("✅ SSE Connection Established!");
    };

    es.onerror = (err) => {
      console.error("❌ SSE Connection Error:", err);
    };

    return () => {
      console.log("🔌 Closing SSE Connection");
      es.close();
    };
  }, []);

  const totalHits = stats.t1 + stats.t2;
  const hitRate =
    totalHits + stats.misses > 0
      ? ((totalHits / (totalHits + stats.misses)) * 100).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Background Accent */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 px-6 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}

          <Header />
          {/* Key Metric - Hit Rate */}
          <div className="mb-12 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-8 hover:border-blue-500/30 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm uppercase tracking-widest mb-2">
                  Overall Hit Rate
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-bold text-blue-400">
                    {hitRate}%
                  </span>
                  <span className="text-emerald-400 text-sm flex items-center gap-1">
                    <TrendingUp size={16} />
                    {totalHits} hits this session
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-sm">
                  Tier-1:{" "}
                  <span className="text-blue-400 font-semibold">
                    {stats.t1}
                  </span>
                </p>
                <p className="text-slate-500 text-sm">
                  Tier-2:{" "}
                  <span className="text-amber-400 font-semibold">
                    {stats.t2}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            <StatCard
              title="Tier-1 Hits"
              subtitle="Exact Match Cache"
              value={stats.t1}
              icon={<Zap size={24} />}
              accentColor="blue"
              tag="FASTEST"
            />
            <StatCard
              title="Tier-2 Hits"
              subtitle="Semantic Match"
              value={stats.t2}
              icon={<Activity size={24} />}
              accentColor="amber"
              tag="SMART"
            />
            <StatCard
              title="LLM Misses"
              subtitle="Cache Cold Hits"
              value={stats.misses}
              icon={<Database size={24} />}
              accentColor="rose"
              tag="COLD"
            />
            <StatCard
              title="Guardrail Blocks"
              subtitle="Content Protected"
              value={stats.blocks}
              icon={<ShieldCheck size={24} />}
              accentColor="green"
              tag="PROTECTED"
            />
            <StatCard
              title="Cost Saved"
              subtitle="Estimated Savings"
              value={stats.savings}
              icon={<DollarSign size={24} />}
              accentColor="emerald"
              tag="SAVINGS"
              isCash
            />
              <StatCard
              title="Files Ingested"
              subtitle="Knowledge Base Growth"
              value={stats.files}
              icon={<Database size={24} />}
              accentColor="cyan"
              tag="INGESTED"
            />
             <StatCard
              title="Last Latency (ms)"
              subtitle="Round-trip Time"
              value={stats.latency}
              icon={<Activity size={24} />}
              accentColor="violet"
              tag="LATENCY"
             />
          </div>

          {/* Footer */}
          <footer>
            <p className="text-center text-[10px] text-slate-600 uppercase tracking-widest pt-4">
              Protected by Sentinel Guardrails • End-to-End Encrypted
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
