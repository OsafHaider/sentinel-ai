import Groq from "groq-sdk";
import { performance } from 'perf_hooks';

// --- CONFIGURATION ---
const groq = new Groq({ 
    apiKey: "PASTE_YOUR_GROQ_API_KEY_HERE", 
});

const TOTAL_REQUESTS = 30;

// Teeno scenarios ko test karne ke liye queries
const TEST_QUERIES = [
    "What are the rules for annual leaves?",           
    "What are the rules for annual leaves?",           
    "Tell me about the annual leave regulations"      
];

async function callGroqDirect(query, index) {
    const start = performance.now();
    console.log(`📡 [REQ ${index}] Sending Direct Hit to Groq SDK...`);
    
    try {
        // Standard SDK Implementation: No Cache, No Queue, No Gateway logic
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: "user", content: query }],
            model: "llama-3.3-70b-versatile",
        });

        const latency = performance.now() - start;
        console.log(`✅ [RES ${index}] Received in ${latency.toFixed(2)}ms`);
        
        return { status: 'success', latency };
    } catch (error) {
        console.error(`❌ [ERR ${index}] Groq SDK Error: ${error.message}`);
        return { status: 'error', latency: performance.now() - start };
    }
}

async function runBenchmark() {
    console.log("\n⚠️ STARTING BASELINE TEST: WITHOUT SENTINEL-AI");
    console.log("============================================================");

    const startBench = performance.now();
    const tasks = [];
    
    // Concurrent load simulate kar rahe hain (Seniors ko yehi load test pasand aata hai)
    for (let i = 0; i < TOTAL_REQUESTS; i++) {
        tasks.push(callGroqDirect(TEST_QUERIES[i % TEST_QUERIES.length], i + 1));
    }

    const results = await Promise.all(tasks);
    const endBench = performance.now();

    // --- Metrics Calculation ---
    const successes = results.filter(r => r.status === 'success');
    const failures = results.filter(r => r.status === 'error');
    const avgLat = successes.length > 0 
        ? successes.reduce((acc, r) => acc + r.latency, 0) / successes.length 
        : 0;

    console.log("\n" + "=".repeat(50));
    console.log("📊 RAW SDK BENCHMARK REPORT (NO SENTINEL)");
    console.log("=".repeat(50));
    console.log(`Total Requests:  ${TOTAL_REQUESTS}`);
    console.log(`Successful:      ${successes.length}`);
    console.log(`Failed/Throttled: ${failures.length}`);
    console.log(`Success Rate:    ${((successes.length / TOTAL_REQUESTS) * 100).toFixed(2)}%`);
    console.log(`Avg Latency:     ${avgLat.toFixed(2)}ms`);
    console.log(`Total Wall Time: ${((endBench - startBench) / 1000).toFixed(2)}s`);
    console.log("-".repeat(50));
    console.log(`Compute Load:    100% (Every request hit the LLM)`);
    console.log(`Idempotency:     0% (Duplicates were re-processed)`);
    console.log("=".repeat(50));
}

runBenchmark();
