"use client";
import React, { useEffect, useState } from "react";
import {
  Activity,
  Zap,
  Database,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
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
    tokens: 0,
    spend: "0.0000",
    latency: "0",
    timestamp: "--:--:--",
    pendingResearch: 0,
    autonomousLearned: 0,
  });

  useEffect(() => {
    const es = new EventSource(
      `http://localhost:8008/api/v1/chat/stats/stream`,
      {
        withCredentials: true,
      },
    );

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setStats({
          t1: data.t1 || 0,
          t2: data.t2 || 0,
          misses: data.misses || 0,
          blocks: data.blocks || 0,
          savings: data.savings || "0.0000",
          files: data.files || 0,
          tokens: data.tokens || 0,
          spend: data.spend || "0.0000",
          latency: data.latency || "0",
          pendingResearch: data.pending_research || 0,
          autonomousLearned: data.autonomous_learned || 0,
          timestamp: data.timestamp || "--:--:--",
        });
      } catch (err) {
        console.error("Error parsing metrics:", err);
      }
    };

    return () => es.close();
  }, []);

  // --- Logic Calculations ---
  const totalHits = stats.t1 + stats.t2;
  const totalRequests = totalHits + stats.misses;
  const hitRate =
    totalRequests > 0 ? ((totalHits / totalRequests) * 100).toFixed(1) : 0;
  const netSavings = (
    parseFloat(stats.savings) - parseFloat(stats.spend)
  ).toFixed(4);

  // Dynamic Latency Tagging
  const getLatencyTag = (ms: string) => {
    const time = parseFloat(ms);
    if (time < 100) return "ULTRA FAST";
    if (time < 500) return "OPTIMAL";
    return "CLOUD DELAY";
  };
  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 px-6 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <Header />

          {/* Impact Overview Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex items-center justify-between group hover:border-blue-500/30 transition-all">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-[0.2em] mb-3">
                  System Efficiency
                </p>
                <div className="flex items-baseline gap-4">
                  <span className="text-6xl font-black text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-300">
                    {hitRate}%
                  </span>
                  <div className="flex flex-col">
                    <span className="text-emerald-400 text-sm font-semibold flex items-center gap-1">
                      <TrendingUp size={16} /> {totalHits} Queries Cached
                    </span>
                    <span className="text-slate-500 text-xs mt-1">
                      Optimization Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-linear-to-br from-emerald-500/10 to-blue-500/5 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <ArrowUpRight size={20} />
                <p className="text-xs uppercase tracking-widest font-bold">
                  Net ROI Generated
                </p>
              </div>
              <span className="text-4xl font-mono font-bold text-white tracking-tighter">
                ${netSavings}
              </span>
              <p className="text-slate-500 text-xs mt-2 italic">
                Calculated: Total Savings - Cloud Spend
              </p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Tier-1 Hits"
              subtitle="Instant Key Cache"
              value={stats.t1}
              icon={<Zap size={22} />}
              accentColor="blue"
              tag="FASTEST"
            />
            <StatCard
              title="Tier-2 Hits"
              subtitle="Semantic Logic"
              value={stats.t2}
              icon={<Activity size={22} />}
              accentColor="amber"
              tag="INTELLIGENT"
            />
            <StatCard
              title="Cloud Fallbacks"
              subtitle="Live LLM Synthesis"
              value={stats.misses}
              icon={<Database size={22} />}
              accentColor="rose"
              tag="COLD"
            />
            <StatCard
              title="Guardrails"
              subtitle="Protected Queries"
              value={stats.blocks}
              icon={<ShieldCheck size={22} />}
              accentColor="green"
              tag="SECURE"
            />
            <StatCard
              title="Total Savings"
              subtitle="Gross Cost Reduction"
              value={parseFloat(stats.savings).toFixed(4)}
              icon={<DollarSign size={22} />}
              accentColor="emerald"
              tag="REVENUE"
              isCash
            />
            <StatCard
              title="Cloud Expense"
              subtitle="External API Usage"
              value={parseFloat(stats.spend).toFixed(4)}
              icon={<BarChart3 size={22} />}
              accentColor="rose"
              tag="BILLING"
              isCash
            />
            <StatCard
              title="Throughput"
              subtitle="Tokens via Groq"
              value={stats.tokens.toLocaleString()}
              icon={<TrendingUp size={22} />}
              accentColor="violet"
              tag="TRAFFIC"
            />
            <StatCard
              title="Latency"
              subtitle="Round-trip Time (ms)"
              value={stats.latency}
              icon={<Activity size={22} />}
              accentColor="violet"
              tag={getLatencyTag(stats.latency)}
            />
            {/* Stats Grid Container ke andar */}
            {/* <StatCard
              title="Pending Research"
              subtitle="Gaps in Queue"
              value={stats.pendingResearch}
              icon={<Activity size={24} />}
              accentColor="amber"
              tag="QUEUED"
            />

            <StatCard
              title="Autonomous Brain"
              subtitle="Self-Learned Concepts"
              value={stats.autonomousLearned}
              icon={<Zap size={24} />}
              accentColor="emerald"
              tag="LEARNED"
            /> */}
          </div>

          <footer className="mt-16 border-t border-slate-900 pt-6 flex justify-center items-center px-2">
            <p className="text-[10px]  text-slate-600 uppercase tracking-[0.3em]">
              powered by Sentinel AI - Your Ultimate LLM Optimization Assistant
            </p>
          
          </footer>
        </div>
      </div>
    </div>
  );
}
