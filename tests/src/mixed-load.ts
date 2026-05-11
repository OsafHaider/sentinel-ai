import axios from 'axios';

const GATEWAY_URL = "http://localhost:8008/api/v1/chat";

async function runMixedLoadTest() {
    // 20 Mixed Queries ka Array
    const queries = [
        "What is leave policy?", "What is leave policy?", // Duplicate Group 1
        "How to apply for sick leave?", "How to apply for sick leave?", // Duplicate Group 2
        "Tell me about insurance", "Tell me about insurance", // Duplicate Group 3
        "Who is the CEO?", "Office timings?", "Salary date?", // Unique Queries
        "What is leave policy?", "What is leave policy?", "What is leave policy?", // More duplicates
        "Random question 1", "Random question 2", "Random question 3",
        "How to apply for sick leave?", "Tell me about insurance", "Office timings?", "What is leave policy?"
    ];

    console.log(`🚀 Starting Mixed-Load Test with ${queries.length} requests...`);
    const startTime = Date.now();

    const requests = queries.map((q, i) => 
        axios.post(GATEWAY_URL, {
            query: q,
            userId: `user_mixed_${i}`,
            bypassCache: false
        }, { timeout: 60000 })
        .then(res => ({ query: q, status: res.status, source: res.data.source || 'Worker' }))
        .catch(err => ({ error: true, status: err.response?.status }))
    );

    const results = await Promise.all(requests);
    const totalTime = (Date.now() - startTime) / 1000;

    // Analysis
    const cacheHits = results.filter(r => r.source === 'Sentinel-Exact-Cache').length;
    const workerJobs = results.filter(r => r.status === 202).length;
    const failed = results.filter(r => r.error).length;

    console.log("\n--- 📊 MIXED-LOAD REPORT ---");
    console.log(`Total Requests: ${queries.length}`);
    console.log(`🚀 Cache Hits (Instant): ${cacheHits}`);
    console.log(`⚙️  New Worker Jobs (Deduplicated): ${workerJobs}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${totalTime.toFixed(2)}s`);
    console.log("-----------------------------\n");
}

runMixedLoadTest();
