import axios from 'axios';
import {EventSource} from 'eventsource';
import { performance } from 'perf_hooks';

const BASE_URL = "http://localhost:8008/api/v1/chat";
const TOTAL_REQUESTS = 30;

const TEST_QUERIES = [
    "What is AI Middleware?", 
    "Explain Sentinel-AI Architecture", 
    "How does SSE improve latency?"
];

async function testSentinelSSE(query, index) {
    const start = performance.now();
    try {
        console.log(`[REQ ${index}] 📨 Sending to Gateway...`);
        
        const resp = await axios.post(BASE_URL, { query, userId: `user-${index}` });
        
        // Scenario 1: Tier-1 Instant HIT
        if (resp.data.status === 'completed') {
            const lat = performance.now() - start;
            console.log(`[REQ ${index}] 🎯 T1-HIT in ${lat.toFixed(2)}ms`);
            return { status: 'success', latency: lat, type: 'T1' };
        }

        // Scenario 2: Queued (Wait for SSE)
        if (resp.data.status === 'queued') {
            const jobId = resp.data.jobId;
            console.log(`[REQ ${index}] ⏳ Queued. JobID: ${jobId}. Opening SSE...`);
            
            return new Promise((resolve) => {
                const streamUrl = `http://localhost:8008/api/v1/chat/stream/${jobId}`;
                const es = new EventSource(streamUrl);
                
                const timer = setTimeout(() => {
                    console.log(`[REQ ${index}] ⏰ Timeout after 30s`);
                    es.close();
                    resolve({ status: 'timeout', latency: 30000 });
                }, 30000);

                es.onmessage = (event) => {
                    console.log(`[REQ ${index}] 📥 SSE Message Received!`);
                    const data = JSON.parse(event.data);
                    
                    // Sentinel Webhook format: status: 'completed'
                    if (data.status === 'completed' || data.response) {
                        clearTimeout(timer);
                        const lat = performance.now() - start;
                        console.log(`[REQ ${index}] ✅ Job Done! Latency: ${lat.toFixed(2)}ms`);
                        es.close();
                        resolve({ status: 'success', latency: lat, type: 'WORKER' });
                    }
                };

                es.onerror = (err) => {
                    console.log(`[REQ ${index}] ❌ SSE Error for Job ${jobId}`);
                    clearTimeout(timer);
                    es.close();
                    resolve({ status: 'error', latency: 0 });
                };
            });
        }
        
        console.log(`[REQ ${index}] ❓ Unknown Response Status: ${resp.data.status}`);
        return { status: 'error', latency: 0 };

    } catch (e) {
        console.log(`[REQ ${index}] 🔥 Gateway Connection Failed: ${e.message}`);
        return { status: 'error', latency: 0 };
    }
}

async function runStressTest() {
    console.log("\n🔥 STARTING DEBUG STRESS TEST (30 REQS)...");
    const startBench = performance.now();
    
    const tasks = [];
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        tasks.push(testSentinelSSE(TEST_QUERIES[i % TEST_QUERIES.length], i + 1));
    }

    const results = await Promise.all(tasks);
    const endBench = performance.now();

    const successes = results.filter(r => r.status === 'success');
    const t1Hits = results.filter(r => r.type === 'T1').length;
    const workerHits = results.filter(r => r.type === 'WORKER').length;
    const avgLat = successes.length > 0 ? successes.reduce((acc, r) => acc + r.latency, 0) / successes.length : 0;

    console.log("\n" + "=".repeat(50));
    console.log("📊 SENTINEL-AI PERFORMANCE REPORT");
    console.log("=".repeat(50));
    console.log(`Total Requests:  ${TOTAL_REQUESTS}`);
    console.log(`Success Rate:    ${((successes.length / TOTAL_REQUESTS) * 100).toFixed(2)}%`);
    console.log(`T1 (Exact) Hits: ${t1Hits}`);
    console.log(`Worker (LLM) Hits: ${workerHits}`);
    console.log(`Avg Latency:     ${avgLat.toFixed(2)}ms`);
    console.log(`Total Wall Time: ${((endBench - startBench) / 1000).toFixed(2)}s`);
    console.log("=".repeat(50));
}

runStressTest();
