import axios from 'axios';

const GATEWAY_URL = "http://localhost:8008/api/v1/chat";
const CONCURRENT_REQUESTS = 20; 

async function runReliabilityTest() {
    console.log(`🚀 Starting Reliability Test with ${CONCURRENT_REQUESTS} concurrent requests...`);
    
    const startTime = Date.now();
    const requests = [];

    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        // Request ko push karte waqt hum ensure karenge k success aur failure dono handle hon
        const request = axios.post(GATEWAY_URL, {
            query: "What is the company leave policy?",
            userId: `user_test_${i}`, // 🛡️ Unique user ID to avoid rate limits
            bypassCache: false
        }, { timeout: 60000 })
        .then(res => ({ error: false, status: res.status })) // ✅ Success handle
        .catch(err => {
            console.log(`❌ Request ${i} failed: ${err.response?.status} - ${err.response?.data?.error || err.message}`);
            return { error: true, status: err.response?.status }; // ❌ Failure handle
        });

        requests.push(request);
    }

    const results = await Promise.all(requests);

    // Ab filter sahi kaam karega kyunke humne custom object return kiya hai
    const successful = results.filter(r => r.error === false && (r.status === 200 || r.status === 202)).length;// 202 because Sentinel returns 202 Accepted
    const failed = CONCURRENT_REQUESTS - successful;
    const totalTime = (Date.now() - startTime) / 1000;

    console.log("\n--- 📊 RELIABILITY REPORT ---");
    console.log(`Total Requests: ${CONCURRENT_REQUESTS}`);
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time Taken: ${totalTime.toFixed(2)} seconds`);
    console.log(`📈 Throughput: ${(successful / totalTime).toFixed(2)} req/sec`);
    console.log("-----------------------------\n");
}

runReliabilityTest();
