<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Sentinel-AI README</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #09090b;
    --surface: #111113;
    --surface2: #18181b;
    --border: rgba(255,255,255,0.08);
    --border2: rgba(255,255,255,0.14);
    --accent: #6366f1;
    --accent2: #818cf8;
    --accent-glow: rgba(99,102,241,0.15);
    --green: #10b981;
    --green-dim: rgba(16,185,129,0.12);
    --amber: #f59e0b;
    --amber-dim: rgba(245,158,11,0.10);
    --red: #f43f5e;
    --text: #e4e4e7;
    --text2: #a1a1aa;
    --text3: #71717a;
    --mono: 'JetBrains Mono', monospace;
    --sans: 'Syne', sans-serif;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--sans);
    font-size: 15px;
    line-height: 1.7;
    max-width: 880px;
    margin: 0 auto;
    padding: 60px 32px 120px;
  }

  /* ─── HEADER ─── */
  .header {
    border-bottom: 1px solid var(--border2);
    padding-bottom: 40px;
    margin-bottom: 56px;
  }

  .badge-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .badge {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    padding: 3px 10px;
    border-radius: 4px;
    letter-spacing: 0.04em;
  }

  .badge-purple { background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); }
  .badge-green  { background: rgba(16,185,129,0.12); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.25); }
  .badge-gray   { background: rgba(255,255,255,0.05); color: var(--text3); border: 1px solid var(--border); }

  h1 {
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: #fff;
    margin-bottom: 8px;
  }

  .tagline {
    font-size: 13px;
    font-family: var(--mono);
    color: var(--accent2);
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .lead {
    font-size: 17px;
    color: var(--text2);
    max-width: 620px;
    line-height: 1.65;
    margin-bottom: 28px;
  }

  .lead strong { color: var(--text); font-weight: 600; }

  /* ─── STAT CARDS ─── */
  .stat-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
    margin: 40px 0;
  }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--accent), transparent);
  }

  .stat-card.green::before { background: linear-gradient(90deg, var(--green), transparent); }
  .stat-card.amber::before { background: linear-gradient(90deg, var(--amber), transparent); }

  .stat-val {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #fff;
    line-height: 1;
    margin-bottom: 6px;
  }

  .stat-card.green .stat-val { color: #6ee7b7; }
  .stat-card.amber .stat-val { color: #fcd34d; }

  .stat-label {
    font-size: 12px;
    color: var(--text3);
    font-family: var(--mono);
    letter-spacing: 0.03em;
  }

  /* ─── SECTION HEADINGS ─── */
  h2 {
    font-size: 22px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.02em;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  h2 .section-num {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--accent2);
    font-weight: 400;
    opacity: 0.7;
  }

  h3 {
    font-size: 15px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 10px;
    letter-spacing: -0.01em;
  }

  section { margin-bottom: 60px; }

  p { color: var(--text2); margin-bottom: 14px; }
  p:last-child { margin-bottom: 0; }

  /* ─── ARCH DIAGRAM ─── */
  .arch-diagram {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 32px;
    margin: 24px 0;
    overflow-x: auto;
  }

  .flow {
    display: flex;
    flex-direction: column;
    gap: 0;
    font-family: var(--mono);
    font-size: 12px;
  }

  .flow-tier {
    display: flex;
    align-items: center;
    gap: 0;
  }

  .flow-node {
    border-radius: 6px;
    padding: 8px 14px;
    font-size: 11px;
    font-family: var(--mono);
    white-space: nowrap;
    text-align: center;
    min-width: 120px;
    font-weight: 500;
  }

  .fn-user    { background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); }
  .fn-gateway { background: rgba(30,27,75,0.8);   color: #c7d2fe; border: 1px solid rgba(99,102,241,0.35); }
  .fn-cache   { background: rgba(15,23,42,0.9);   color: #94a3b8; border: 1px solid rgba(148,163,184,0.25); }
  .fn-worker  { background: rgba(6,78,59,0.5);    color: #6ee7b7; border: 1px solid rgba(16,185,129,0.3); }
  .fn-queue   { background: rgba(124,45,18,0.4);  color: #fdba74; border: 1px solid rgba(234,88,12,0.3); }
  .fn-llm     { background: rgba(88,28,135,0.4);  color: #d8b4fe; border: 1px solid rgba(168,85,247,0.35); }
  .fn-mongo   { background: rgba(5,46,22,0.6);    color: #86efac; border: 1px solid rgba(34,197,94,0.3); }

  /* ─── FLOW VISUAL ─── */
  .pipeline {
    display: grid;
    grid-template-columns: 1fr;
    gap: 2px;
    margin: 24px 0;
  }

  .pipe-step {
    display: flex;
    align-items: stretch;
    gap: 0;
  }

  .pipe-label {
    width: 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .pipe-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--accent);
    margin-top: 16px;
    flex-shrink: 0;
  }

  .pipe-line {
    flex: 1;
    width: 1px;
    background: var(--border2);
  }

  .pipe-step:last-child .pipe-line { display: none; }

  .pipe-content {
    flex: 1;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 4px;
    margin-left: 12px;
  }

  .pipe-content h4 {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 4px;
  }

  .pipe-content p {
    font-size: 13px;
    color: var(--text3);
    margin: 0;
    line-height: 1.5;
  }

  .pipe-step:nth-child(1) .pipe-dot { background: var(--accent); }
  .pipe-step:nth-child(2) .pipe-dot { background: var(--accent2); }
  .pipe-step:nth-child(3) .pipe-dot { background: var(--green); }
  .pipe-step:nth-child(4) .pipe-dot { background: var(--amber); }
  .pipe-step:nth-child(5) .pipe-dot { background: var(--red); }

  /* ─── TABLES ─── */
  .table-wrap {
    overflow-x: auto;
    margin: 20px 0;
    border-radius: 10px;
    border: 1px solid var(--border);
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  thead th {
    background: var(--surface2);
    color: var(--text3);
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--border2);
  }

  tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }

  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: rgba(255,255,255,0.02); }

  td {
    padding: 12px 16px;
    color: var(--text2);
    vertical-align: top;
  }

  td:first-child { color: var(--text); font-weight: 500; }

  td code, th code {
    font-family: var(--mono);
    font-size: 11px;
    background: rgba(255,255,255,0.06);
    padding: 2px 6px;
    border-radius: 3px;
    color: var(--accent2);
  }

  .latency-badge {
    font-family: var(--mono);
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    white-space: nowrap;
    font-weight: 500;
  }

  .lat-fast   { background: var(--green-dim);  color: #6ee7b7; }
  .lat-med    { background: var(--amber-dim);  color: #fcd34d; }
  .lat-slow   { background: rgba(244,63,94,0.10); color: #fda4af; }

  /* ─── KPI GRID ─── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
    margin: 24px 0;
  }

  .kpi-row {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .kpi-metric { font-size: 13px; color: var(--text2); }
  .kpi-val    { font-family: var(--mono); font-size: 13px; color: #6ee7b7; font-weight: 500; }

  /* ─── CALLOUT BOXES ─── */
  .callout {
    border-left: 3px solid var(--accent);
    background: var(--accent-glow);
    border-radius: 0 8px 8px 0;
    padding: 16px 20px;
    margin: 24px 0;
    font-size: 14px;
    color: var(--text2);
  }

  .callout strong { color: #c7d2fe; }

  .callout-green {
    border-left-color: var(--green);
    background: var(--green-dim);
  }

  .callout-green strong { color: #6ee7b7; }

  /* ─── FEATURE LIST ─── */
  .feature-list {
    list-style: none;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 10px;
    margin: 20px 0;
  }

  .feature-list li {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 16px;
    font-size: 13px;
    color: var(--text2);
    display: flex;
    align-items: flex-start;
    gap: 10px;
  }

  .feature-list li::before {
    content: '↗';
    color: var(--accent2);
    font-size: 12px;
    margin-top: 2px;
    flex-shrink: 0;
  }

  /* ─── ENGAGEMENT CARDS ─── */
  .eng-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
    margin: 24px 0;
  }

  .eng-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 22px;
  }

  .eng-card h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 10px;
  }

  .eng-card ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .eng-card ul li {
    font-size: 12px;
    color: var(--text3);
    padding-left: 14px;
    position: relative;
  }

  .eng-card ul li::before {
    content: '—';
    position: absolute;
    left: 0;
    color: var(--border2);
  }

  /* ─── FOOTER / LICENSE ─── */
  .footer {
    border-top: 1px solid var(--border);
    padding-top: 32px;
    margin-top: 60px;
    font-family: var(--mono);
    font-size: 11px;
    color: var(--text3);
    letter-spacing: 0.04em;
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* ─── DIVIDER ─── */
  .divider {
    height: 1px;
    background: var(--border);
    margin: 40px 0;
  }

  /* ─── INLINE CODE ─── */
  code {
    font-family: var(--mono);
    font-size: 12px;
    background: rgba(255,255,255,0.07);
    padding: 2px 7px;
    border-radius: 4px;
    color: #c4b5fd;
  }

  /* ─── MERMAID placeholder ─── */
  .mermaid-placeholder {
    background: var(--surface2);
    border: 1px dashed var(--border2);
    border-radius: 10px;
    padding: 28px;
    text-align: center;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text3);
    margin: 24px 0;
    line-height: 1.8;
  }

  /* ─── MEMORY TABLE special ─── */
  .mem-policy {
    font-family: var(--mono);
    font-size: 12px;
    background: rgba(99,102,241,0.08);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 8px;
    padding: 14px 18px;
    color: #a5b4fc;
    margin: 16px 0;
    display: inline-block;
  }
</style>
</head>
<body>

<!-- ══════════════════════════════════════
     HEADER
══════════════════════════════════════ -->
<header class="header">
  <div class="badge-row">
    <span class="badge badge-purple">Enterprise</span>
    <span class="badge badge-green">Production-Ready</span>
    <span class="badge badge-gray">Proprietary License</span>
  </div>

  <p class="tagline">Enterprise AI Cache + Autonomous Knowledge Discovery Gateway</p>
  <h1>Sentinel&#x2011;AI</h1>

  <p class="lead">
    Slash LLM operating costs by <strong>60–80%</strong> while driving hot-path response latency
    below <strong>4ms</strong> under sustained production load.
  </p>

  <p class="lead">
    Sentinel-AI is not another wrapper around OpenAI APIs. It is a hardened inference acceleration
    layer engineered for organizations bleeding money through repetitive token generation,
    cache-miss storms, and redundant retrieval pipelines.
  </p>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="stat-val">&lt;4ms</div>
      <div class="stat-label">Tier-1 retrieval latency</div>
    </div>
    <div class="stat-card green">
      <div class="stat-val">60–80%</div>
      <div class="stat-label">Token spend reduction</div>
    </div>
    <div class="stat-card amber">
      <div class="stat-val">&gt;85%</div>
      <div class="stat-label">Target cache hit ratio</div>
    </div>
    <div class="stat-card">
      <div class="stat-val">99.9%</div>
      <div class="stat-label">Worker recovery rate</div>
    </div>
  </div>
</header>


<!-- ══════════════════════════════════════
     ARCHITECTURE
══════════════════════════════════════ -->
<section>
  <h2><span class="section-num">01</span> Architecture</h2>

  <p>
    The platform aggressively intercepts semantic duplicate queries, performs vectorized similarity
    resolution inside Redis Stack HNSW indexes, and autonomously heals cache gaps using asynchronous
    knowledge promotion workers — without blocking the request lifecycle.
  </p>

  <div class="arch-diagram">
    <p style="font-family: var(--mono); font-size: 11px; color: var(--text3); margin-bottom: 20px; letter-spacing: 0.06em;">REQUEST LIFECYCLE</p>

    flowchart TD

%% =========================================
%% STYLES
%% =========================================
classDef user fill:#0284c7,stroke:#0369a1,color:#fff,stroke-width:2px;
classDef gateway fill:#1e1b4b,stroke:#6366f1,color:#fff,stroke-width:2px;
classDef worker fill:#064e3b,stroke:#059669,color:#fff,stroke-width:2px;
classDef queue fill:#7c2d12,stroke:#ea580c,color:#fff,stroke-width:2px;
classDef storage fill:#0f172a,stroke:#475569,color:#fff,stroke-width:2px;
classDef research fill:#581c87,stroke:#a855f7,color:#fff,stroke-width:2px;

%% =========================================
%% USER ENTRY
%% =========================================
User([User Sends Query]):::user

Gateway[Fastify API Gateway]:::gateway

User -->|01. Transmits raw query alphanumeric string| Gateway

%% =========================================
%% TIER 1 CACHE
%% =========================================
Gateway -->|02. Applies lower-strip text normalization| T1Check{Tier-1 Exact Match Cache?}:::gateway

T1Cache[(Redis T1 Exact Cache)]:::storage

T1Check -->|03. Dispatches high-speed string hash lookup| T1Cache

T1Cache -->|04a. Exact Match Found| FastResponse[Return Response in ~3ms]:::gateway

FastResponse -->|05a. Return microsecond intercepted response payload| User

%% =========================================
%% CACHE MISS FLOW
%% =========================================
T1Cache -->|04b. No Match Found| Queue[BullMQ Task Queue]:::queue

Queue -->|06. Dequeue non-blocking job task stream states| QueryWorker[Python Query Worker]:::worker

%% =========================================
%% EMBEDDING + VECTOR SEARCH
%% =========================================
QueryWorker -->|07. Offloads string token matrices processing| Embedding[Generate Query Embedding<br/>SentenceTransformer]:::worker

Embedding -->|08. Instantiates semantic matching arrays maps| SemanticSearch{Semantic Match Found?}:::worker

VectorDB[(Redis HNSW Vector Index)]:::storage

SemanticSearch -->|09. Computes spatial cosine proximity matrices queries| VectorDB

VectorDB -->|10a. Semantic Match Found| SemanticResponse[Return Similar Cached Response]:::gateway

SemanticResponse -->|11a. Stream matched semantic context values| User

%% =========================================
%% NO SEMANTIC MATCH
%% =========================================
VectorDB -->|10b. No Semantic Match| Intent[Intent Classification Layer]:::worker

%% =========================================
%% GENERIC QUERY FLOW
%% =========================================
Intent -->|12a. Generic Query| Groq[Groq LLM Inference]:::storage

Groq -->|13a. Run inference chain pipeline keys| GenericResponse[Generate AI Response<br/>and Store in Cache]:::gateway

GenericResponse -->|14a. Deliver global generic text back to viewport| User

%% =========================================
%% PRIVATE KNOWLEDGE FLOW
%% =========================================
Intent -->|12b. Private / Company Data Query| MongoVector[(MongoDB Vector Search)]:::storage

MongoVector -->|13b. Relevant Context Found: Score > 0.75| Groq

MongoVector -->|13c. No Strong Match: Index Threshold Missed| MongoText[(MongoDB Text Search)]:::storage

MongoText -->|14c. Fallback Match Found: Direct String Pulled| Groq

%% =========================================
%% KNOWLEDGE GAP FLOW
%% =========================================
MongoText -->|14d. Nothing Found: Complete Knowledge Leak| Guardrail[Guardrail Protection Layer]:::gateway

Guardrail -->|15. Dispatches instant webhook status pulse back to gateway| SafeReply[Send Safe Default Response]:::gateway

SafeReply -->|16. Print default corporate guardrail message stream| User

Guardrail -->|17. Asynchronously push tracking missing string metadata| GapQueue[(Knowledge Gaps Queue)]:::queue

%% =========================================
%% SELF-HEALING BACKGROUND SYSTEM
%% =========================================
GapQueue -->|18. Continuous atomic LPOP loop independent pull| ResearchWorker[Autonomous Research Worker]:::research

ResearchWorker -->|19. Executes non-blocking parallel web parsing queries| Tavily[Tavily Web Research]:::storage

Tavily -->|20. Run rigid context factual summaries compression| Summary[Groq Fact Summarization]:::storage

Summary -->|21. Commit immutable database upsert verification transaction| Store[(MongoDB Permanent Knowledge Base)]:::storage

%% =========================================
%% CACHE PROMOTION
%% =========================================
Store -->|22a. REAL-TIME CACHE PROMOTION: Sync write| PromoteT1[Update Tier-1 Exact Cache]:::research

Store -->|22b. REAL-TIME CACHE PROMOTION: Sync write| PromoteT2[Update Tier-2 Semantic Cache]:::research

%% =========================================
%% FINAL RESULT
%% =========================================
PromoteT1 --> SelfHeal[Previously Failed Questions<br/>Now Resolve Automatically]:::research

PromoteT2 --> SelfHeal

SelfHeal -->|23. Future user duplicates now match instant cache without restart| User

  </div>

  <div class="callout">
    <strong>Zero-downtime promotion.</strong> The gateway never waits for knowledge enrichment before responding. Cache misses and knowledge acquisition are fully decoupled — the knowledge graph evolves live under production traffic.
  </div>
</section>


<!-- ══════════════════════════════════════
     SYSTEM STACK
══════════════════════════════════════ -->
<section>
  <h2><span class="section-num">02</span> System Stack</h2>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Layer</th>
          <th>Technology</th>
          <th>Responsibility</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>API Gateway</td>
          <td><code>Node.js + Fastify</code></td>
          <td>Ultra-low-overhead request ingress, cache orchestration, semantic routing, telemetry hooks</td>
        </tr>
        <tr>
          <td>Async Processing</td>
          <td><code>BullMQ</code></td>
          <td>Distributed promotion queues, retry orchestration, failure isolation, autonomous cache healing</td>
        </tr>
        <tr>
          <td>Hot Cache</td>
          <td><code>Redis</code></td>
          <td>Tier-1 exact-query memory retrieval with sub-5ms lookup targets</td>
        </tr>
        <tr>
          <td>Semantic Cache</td>
          <td><code>Redis Stack HNSW</code></td>
          <td>Approximate nearest-neighbor semantic retrieval for paraphrased and transformed prompts</td>
        </tr>
        <tr>
          <td>Knowledge Workers</td>
          <td><code>Python + Astral UV</code></td>
          <td>High-performance isolated execution runtime for retrieval, summarization, embedding generation</td>
        </tr>
        <tr>
          <td>External Retrieval</td>
          <td><code>Tavily</code></td>
          <td>Real-time knowledge extraction and source aggregation</td>
        </tr>
        <tr>
          <td>Summarization</td>
          <td><code>Groq</code></td>
          <td>High-speed LLM summarization and response normalization</td>
        </tr>
        <tr>
          <td>Observability</td>
          <td><code>OTel / Prometheus / Grafana</code></td>
          <td>Latency profiling, hit-ratio monitoring, cache pressure diagnostics</td>
        </tr>
        <tr>
          <td>Queue Persistence</td>
          <td><code>Redis Streams</code></td>
          <td>Durable event-driven promotion lifecycle management</td>
        </tr>
        <tr>
          <td>Embedding Layer</td>
          <td><code>SentenceTransformers / OpenAI</code></td>
          <td>Vector generation for semantic similarity indexing</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>


<!-- ══════════════════════════════════════
     CACHE PROMOTION
══════════════════════════════════════ -->
<section>
  <h2><span class="section-num">03</span> Real-Time Cache Promotion</h2>

  <h3>Dual-Write Synchronization</h3>
  <p>
    Every promoted knowledge artifact is committed into both cache tiers simultaneously.
    This guarantees deterministic Tier-1 replays and Tier-2 ANN recovery while the
    infrastructure remains stable under unpredictable traffic bursts.
  </p>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Objective</th>
          <th>Result</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Exact replay acceleration</td><td>Deterministic Tier-1 hits</td></tr>
        <tr><td>Semantic replay acceleration</td><td>Tier-2 ANN recovery</td></tr>
        <tr><td>Traffic adaptation</td><td>Continuous cache learning</td></tr>
        <tr><td>Infrastructure stability</td><td>No blocking synchronous enrichment</td></tr>
        <tr><td>Runtime continuity</td><td>Zero-downtime cache evolution</td></tr>
      </tbody>
    </table>
  </div>

  <h3>Memory Guardrails</h3>
  <p>Sentinel-AI is intentionally engineered to survive memory pressure spikes without collapsing the node.</p>

  <div class="mem-policy">maxmemory-policy volatile-lru</div>

  <p>
    This prevents uncontrolled memory exhaustion by evicting only volatile cache keys using
    least-recently-used prioritization. Persistent operational metadata remains protected.
  </p>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Guardrail</th>
          <th>Operational Purpose</th>
        </tr>
      </thead>
      <tbody>
        <tr><td><code>volatile-lru</code> eviction</td><td>Prevents catastrophic RAM exhaustion</td></tr>
        <tr><td>TTL-bound semantic entries</td><td>Eliminates stale vector buildup</td></tr>
        <tr><td>Queue isolation</td><td>Prevents worker saturation from poisoning API latency</td></tr>
        <tr><td>Bounded vector dimensions</td><td>Controls HNSW graph memory expansion</td></tr>
        <tr><td>Background compaction</td><td>Reduces fragmentation pressure</td></tr>
        <tr><td>Worker concurrency caps</td><td>Prevents CPU oversubscription</td></tr>
        <tr><td>Rate-limited promotions</td><td>Stops cache-thrashing during traffic storms</td></tr>
      </tbody>
    </table>
  </div>

  <div class="callout">
    <strong>Failure scenario engineering.</strong> Without memory guardrails, vector indexes balloon uncontrollably, Redis enters swap pressure, the kernel OOM killer terminates processes, and API latency cascades exponentially. Sentinel-AI explicitly designs against these patterns.
  </div>
</section>


<!-- ══════════════════════════════════════
     PERFORMANCE
══════════════════════════════════════ -->
<section>
  <h2><span class="section-num">04</span> Performance Telemetry</h2>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th>Retrieval Path</th>
          <th>Avg. Latency</th>
          <th>LLM Required</th>
          <th>Cost</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Tier-1 Exact Match</td>
          <td><span class="latency-badge lat-fast">3.22ms</span></td>
          <td>No</td>
          <td>Near-zero</td>
        </tr>
        <tr>
          <td>Tier-2 Semantic Match</td>
          <td><span class="latency-badge lat-fast">6–14ms</span></td>
          <td>No</td>
          <td>Extremely low</td>
        </tr>
        <tr>
          <td>Warm Promotion Retrieval</td>
          <td><span class="latency-badge lat-med">40–90ms</span></td>
          <td>Partial</td>
          <td>Moderate</td>
        </tr>
        <tr>
          <td>Full External Knowledge Fetch</td>
          <td><span class="latency-badge lat-med">400ms–2.5s</span></td>
          <td>Yes</td>
          <td>Highest</td>
        </tr>
        <tr>
          <td>Cold LLM Generation</td>
          <td><span class="latency-badge lat-slow">1.2s–6s</span></td>
          <td>Yes</td>
          <td>Expensive</td>
        </tr>
      </tbody>
    </table>
  </div>

  <h3>Target Production KPIs</h3>
  <div class="kpi-grid">
    <div class="kpi-row"><span class="kpi-metric">Cache Hit Ratio</span><span class="kpi-val">&gt; 85%</span></div>
    <div class="kpi-row"><span class="kpi-metric">Token Spend Reduction</span><span class="kpi-val">60–80%</span></div>
    <div class="kpi-row"><span class="kpi-metric">P95 Gateway Latency</span><span class="kpi-val">&lt; 15ms</span></div>
    <div class="kpi-row"><span class="kpi-metric">Tier-1 Retrieval</span><span class="kpi-val">&lt; 4ms</span></div>
    <div class="kpi-row"><span class="kpi-metric">Worker Recovery Rate</span><span class="kpi-val">99.9%</span></div>
    <div class="kpi-row"><span class="kpi-metric">Queue Retry Success</span><span class="kpi-val">&gt; 97%</span></div>
  </div>
</section>


<!-- ══════════════════════════════════════
     B2B ADVISORY
══════════════════════════════════════ -->
<section>
  <h2><span class="section-num">05</span> B2B Enterprise Advisory</h2>

  <p>
    Sentinel-AI is structured for organizations already operating large-scale AI workloads and
    attempting to stop uncontrolled inference spending. This is infrastructure optimization work —
    not prompt-engineering theater.
  </p>

  <div class="eng-grid">

    <div class="eng-card">
      <h4>Fractional AI Infrastructure Advisory</h4>
      <ul>
        <li>Multi-model inference systems</li>
        <li>RAG platform architecture</li>
        <li>AI support automation</li>
        <li>Semantic retrieval systems</li>
        <li>Agentic orchestration layers</li>
      </ul>
    </div>

    <div class="eng-card">
      <h4>Fixed-Term Optimization Sprints</h4>
      <ul>
        <li>Cache-hit amplification</li>
        <li>Vector search optimization</li>
        <li>Redis memory stabilization</li>
        <li>Queue throughput recovery</li>
        <li>Inference-cost compression</li>
        <li>Latency collapse remediation</li>
      </ul>
    </div>

    <div class="eng-card">
      <h4>Shared-Savings Pricing Model</h4>
      <ul>
        <li>Baseline token spend established</li>
        <li>Optimization layer deployed</li>
        <li>Savings delta measured post-deployment</li>
        <li>Pricing tied to infrastructure savings</li>
      </ul>
    </div>

  </div>

  <div class="callout callout-green">
    <strong>Aligned incentives.</strong> If the system does not materially reduce AI operating cost, the engagement model fails by design. Savings are measured, not assumed.
  </div>
</section>


<!-- ══════════════════════════════════════
     DEPLOYMENT PHILOSOPHY
══════════════════════════════════════ -->
<section>
  <h2><span class="section-num">06</span> Deployment Philosophy</h2>

  <ul class="feature-list">
    <li>Deterministic performance</li>
    <li>Infrastructure survivability</li>
    <li>Low-latency memory retrieval</li>
    <li>Autonomous cache evolution</li>
    <li>Operational cost compression</li>
    <li>Zero-downtime knowledge promotion</li>
  </ul>

  <p style="margin-top: 20px;">Everything else is secondary.</p>
</section>


<!-- ══════════════════════════════════════
     FOOTER
══════════════════════════════════════ -->
<footer class="footer">
  <span>PROPRIETARY ENTERPRISE INFRASTRUCTURE SOFTWARE</span>
  <span>INTERNAL DISTRIBUTION OR LICENSED COMMERCIAL USAGE ONLY</span>
</footer>

</body>
</html>