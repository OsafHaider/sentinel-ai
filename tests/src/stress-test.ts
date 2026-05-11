import axios from 'axios';

const API_URL = "http://localhost:8008/api/v1/chat";

const generateQueries = () => {
    const categories = [
        "What is the leave policy?", // Knowledge Base (Hits)
        "Tell me about annual leaves", // Semantic (Should hit cache/RAG)
        "How do I bake a cake?", // Guardrail (Should be blocked)
        "Who is the CEO?", // RAG (May be missing)
        "Give me 20 days off" // Variation of policy
    ];
    
    let queries = [];
    for(let i=0; i<50; i++) {
        queries.push(categories[i % categories.length]);
    }
    return queries;
}

async function runAdvancedStressTest() {
    const queries = generateQueries();
    console.log(`🚀 Starting Advanced Predictability Test: 500 Requests...`);
    
    const start = Date.now();
    
    const chunkSize = 50; 
    for (let i = 0; i < queries.length; i += chunkSize) {
        const chunk = queries.slice(i, i + chunkSize);
        
        const promises = chunk.map((q, index) => {
            // Har request ke liye dynamic aur unique user ID
            const uniqueUserId = `stress_user_${i + index}`; 
            
            return axios.post(API_URL, { 
                query: q, 
                userId: uniqueUserId 
            })
            .then(res => {
                const status = res.data.status === 'completed' ? '⚡ CACHE HIT' : '📡 QUEUED';
            })
            .catch(e => {
                if (e.response?.status === 429) {
                    console.error(`🛑 Rate Limit Hit for ${uniqueUserId}`);
                } else {
                    console.error(`❌ Request Error for ${uniqueUserId}: ${e.message}`);
                }
            });
        });
        
        await Promise.all(promises);
        
        await new Promise(r => setTimeout(r, 200)); 
        
        console.log(`📦 Processed ${i + chunk.length}/500 requests...`);
    }

    const end = Date.now();
    console.log(`\n✅ Test Completed in ${((end - start)/1000).toFixed(2)}s`);
    console.log(`📊 Check your /api/v1/chat/stats API now to see the final results!`);
}

runAdvancedStressTest();
