<!-- Badges -->
<div align="center">

![Enterprise](https://img.shields.io/badge/Enterprise-Production--Ready-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/License-Proprietary-gray?style=for-the-badge)
![Cache Hit](https://img.shields.io/badge/Cache_Hit_Ratio->85%25-10b981?style=for-the-badge)
![Latency](https://img.shields.io/badge/Tier--1_Latency-<4ms-6366f1?style=for-the-badge)

# Sentinel-AI

### Enterprise AI Cache + Autonomous Knowledge Discovery Gateway

**Slash LLM operating costs by 60–80%** while driving hot-path response latency below **4ms** under sustained production load.

Sentinel-AI is not another wrapper around OpenAI APIs. It is a hardened inference acceleration layer engineered for organizations bleeding money through repetitive token generation, cache-miss storms, and redundant retrieval pipelines.

</div>

---

## 📊 Key Metrics

| Metric | Value |
|--------|-------|
| ⚡ Tier-1 Retrieval Latency | `< 4ms` |
| 💰 Token Spend Reduction | `60 – 80%` |
| 🎯 Target Cache Hit Ratio | `> 85%` |
| 🔄 Worker Recovery Rate | `99.9%` |

---

## 📋 Table of Contents

- [Architecture](#01-architecture)
- [System Stack](#02-system-stack)
- [Real-Time Cache Promotion](#03-real-time-cache-promotion)
- [Performance Telemetry](#04-performance-telemetry)
- [B2B Enterprise Advisory](#05-b2b-enterprise-advisory)
- [Deployment Philosophy](#06-deployment-philosophy)

---

## 01 · Architecture

The platform aggressively intercepts semantic duplicate queries, performs vectorized similarity resolution inside Redis Stack HNSW indexes, and autonomously heals cache gaps using asynchronous knowledge promotion workers — without blocking the request lifecycle.

### Request Lifecycle

```
User Query
    │
    ▼
┌─────────────────────┐
│  Fastify API Gateway │  ◄── Text normalization + cache orchestration
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Tier-1 Exact Cache  │  ◄── Redis string hash lookup
│     (Redis)          │
└──────┬──────┬───────┘
       │      │
    HIT │      │ MISS
       │      ▼
       │  ┌──────────────┐
       │  │  BullMQ Queue │  ◄── Async job dispatch
       │  └──────┬───────┘
       │         │
       │         ▼
       │  ┌──────────────────────┐
       │  │  Python Query Worker  │
       │  │  + SentenceTransformer│  ◄── Embedding generation
       │  └──────┬───────────────┘
       │         │
       │         ▼
       │  ┌──────────────────────┐
       │  │  Redis HNSW Vector   │  ◄── Semantic similarity search
       │  │  (Tier-2 Cache)      │
       │  └──────┬──────┬───────┘
       │         │      │
       │      HIT │      │ MISS
       │         │      ▼
       │         │  ┌─────────────────────┐
       │         │  │  Intent Classifier   │
       │         │  └───────┬─────────────┘
       │         │          │
       │         │    ┌─────┴──────┐
       │         │    │            │
       │         │  Generic    Private/
       │         │  Query      Company Data
       │         │    │            │
       │         │    ▼            ▼
       │         │  Groq LLM   MongoDB
       │         │  Inference  Vector Search
       │         │             (score > 0.75)
       │         │                 │ NO MATCH
       │         │                 ▼
       │         │           MongoDB Text Search
       │         │                 │ NO MATCH
       │         │                 ▼
       │         │           ┌─────────────────┐
       │         │           │ Guardrail Layer  │──► Safe Default Response
       │         │           └────────┬────────┘
       │         │                    │
       │         │                    ▼
       │         │           Knowledge Gaps Queue
       │         │                    │
       │         │                    ▼
       │         │           Autonomous Research Worker
       │         │                    │
       │         │                    ▼
       │         │           Tavily Web Research
       │         │                    │
       │         │                    ▼
       │         │           Groq Fact Summarization
       │         │                    │
       │         │                    ▼
       │         │           MongoDB Permanent KB
       │         │               ┌───┴───┐
       │         │               ▼       ▼
       │         │         Tier-1     Tier-2
       │         │         Cache      Cache
       │         │         Promoted   Promoted
       └─────────┴───────────────────────────► Response to User
```

> **Zero-downtime promotion.** The gateway never waits for knowledge enrichment before responding. Cache misses and knowledge acquisition are fully decoupled — the knowledge graph evolves live under production traffic.

---

## 02 · System Stack

| Layer | Technology | Responsibility |
|-------|------------|---------------|
| API Gateway | `Node.js + Fastify` | Ultra-low-overhead request ingress, cache orchestration, semantic routing, telemetry hooks |
| Async Processing | `BullMQ` | Distributed promotion queues, retry orchestration, failure isolation, autonomous cache healing |
| Hot Cache | `Redis` | Tier-1 exact-query memory retrieval with sub-5ms lookup targets |
| Semantic Cache | `Redis Stack HNSW` | Approximate nearest-neighbor semantic retrieval for paraphrased and transformed prompts |
| Knowledge Workers | `Python + Astral UV` | High-performance isolated execution runtime for retrieval, summarization, embedding generation |
| External Retrieval | `Tavily` | Real-time knowledge extraction and source aggregation |
| Summarization | `Groq` | High-speed LLM summarization and response normalization |
| Observability | `OTel / Prometheus / Grafana` | Latency profiling, hit-ratio monitoring, cache pressure diagnostics |
| Queue Persistence | `Redis Streams` | Durable event-driven promotion lifecycle management |
| Embedding Layer | `SentenceTransformers / OpenAI` | Vector generation for semantic similarity indexing |

---

## 03 · Real-Time Cache Promotion

### Dual-Write Synchronization

Every promoted knowledge artifact is committed into both cache tiers simultaneously. This guarantees deterministic Tier-1 replays and Tier-2 ANN recovery while the infrastructure remains stable under unpredictable traffic bursts.

| Objective | Result |
|-----------|--------|
| Exact replay acceleration | Deterministic Tier-1 hits |
| Semantic replay acceleration | Tier-2 ANN recovery |
| Traffic adaptation | Continuous cache learning |
| Infrastructure stability | No blocking synchronous enrichment |
| Runtime continuity | Zero-downtime cache evolution |

### Memory Guardrails

Sentinel-AI is intentionally engineered to survive memory pressure spikes without collapsing the node.

```
maxmemory-policy volatile-lru
```

This prevents uncontrolled memory exhaustion by evicting only volatile cache keys using least-recently-used prioritization. Persistent operational metadata remains protected.

| Guardrail | Operational Purpose |
|-----------|-------------------|
| `volatile-lru` eviction | Prevents catastrophic RAM exhaustion |
| TTL-bound semantic entries | Eliminates stale vector buildup |
| Queue isolation | Prevents worker saturation from poisoning API latency |
| Bounded vector dimensions | Controls HNSW graph memory expansion |
| Background compaction | Reduces fragmentation pressure |
| Worker concurrency caps | Prevents CPU oversubscription |
| Rate-limited promotions | Stops cache-thrashing during traffic storms |

> **⚠️ Failure scenario engineering.** Without memory guardrails, vector indexes balloon uncontrollably, Redis enters swap pressure, the kernel OOM killer terminates processes, and API latency cascades exponentially. Sentinel-AI explicitly designs against these failure patterns.

---

## 04 · Performance Telemetry

| Retrieval Path | Avg. Latency | LLM Required | Cost |
|----------------|-------------|--------------|------|
| Tier-1 Exact Match | `3.22ms` 🟢 | No | Near-zero |
| Tier-2 Semantic Match | `6–14ms` 🟢 | No | Extremely low |
| Warm Promotion Retrieval | `40–90ms` 🟡 | Partial | Moderate |
| Full External Knowledge Fetch | `400ms–2.5s` 🟡 | Yes | Highest |
| Cold LLM Generation | `1.2s–6s` 🔴 | Yes | Expensive |

### Target Production KPIs

| KPI | Target |
|-----|--------|
| Cache Hit Ratio | `> 85%` |
| Token Spend Reduction | `60 – 80%` |
| P95 Gateway Latency | `< 15ms` |
| Tier-1 Retrieval | `< 4ms` |
| Worker Recovery Rate | `99.9%` |
| Queue Retry Success | `> 97%` |

---

## 05 · B2B Enterprise Advisory

Sentinel-AI is structured for organizations already operating large-scale AI workloads and attempting to stop uncontrolled inference spending. This is infrastructure optimization work — not prompt-engineering theater.

### Fractional AI Infrastructure Advisory
- Multi-model inference systems
- RAG platform architecture
- AI support automation
- Semantic retrieval systems
- Agentic orchestration layers

### Fixed-Term Optimization Sprints
- Cache-hit amplification
- Vector search optimization
- Redis memory stabilization
- Queue throughput recovery
- Inference-cost compression
- Latency collapse remediation

### Shared-Savings Pricing Model
- Baseline token spend established
- Optimization layer deployed
- Savings delta measured post-deployment
- Pricing tied to infrastructure savings

> ✅ **Aligned incentives.** If the system does not materially reduce AI operating cost, the engagement model fails by design. Savings are measured, not assumed.

---

## 06 · Deployment Philosophy

Core engineering commitments, in priority order:

- ↗ Deterministic performance
- ↗ Infrastructure survivability
- ↗ Low-latency memory retrieval
- ↗ Autonomous cache evolution
- ↗ Operational cost compression
- ↗ Zero-downtime knowledge promotion

**Everything else is secondary.**

---

<div align="center">

`PROPRIETARY ENTERPRISE INFRASTRUCTURE SOFTWARE`  
`INTERNAL DISTRIBUTION OR LICENSED COMMERCIAL USAGE ONLY`

</div>