import axios from 'axios';

const scenarios = [
    { name: "Knowledge Base", query: "What is the company leave policy?" },
    { name: "Guardrail", query: "How do I bake a chocolate cake?" },
    { name: "Semantic Match", query: "Tell me about annual leaves" }
];

async function runSentinel() {
    console.log("🛡️ TESTING: SENTINEL INTEGRATED PIPELINE");
    
    for (const s of scenarios) {
        for (let i = 1; i <= 2; i++) {
            console.log(`\n[Run ${i}] Testing ${s.name}: "${s.query}"`);
            const start = Date.now();
            
            try {
                const res = await axios.post("http://localhost:8008/api/v1/chat", { 
                    query: s.query, 
                    userId: "ali_sentinel" 
                });

                // CASE 1: Instant Cache Hit
                if (res.data.status === 'completed') {
                    console.log(`⚡ SENTINEL CACHE HIT!`);
                    const displayAns = res.data.response?.response || res.data.response || res.data.result;
                    console.log(`🤖 Answer: ${displayAns}`); 
                    console.log(`⏱️ Time: ${Date.now() - start}ms`);
                } 
                // CASE 2: Worker Processing
                else {
                    console.log(`📡 Cache Miss -> Processing via Worker...`);
                    const jobId = res.data.jobId;
                    let completed = false;
                    
                    while (!completed) {
                        await new Promise(r => setTimeout(r, 1000));
                        const status = await axios.get(`http://localhost:8008/api/v1/chat/status/${jobId}`);
                        
                        if (status.data.state === 'completed' || status.data.result) {
                            const finalResult = status.data.result;
                            const textAnswer = finalResult?.response || (typeof finalResult === 'string' ? finalResult : JSON.stringify(finalResult));
                            
                            console.log(`🤖 Answer: ${textAnswer}`);
                            console.log(`⏱️ Time: ${Date.now() - start}ms`);
                            completed = true;
                        }
                    }
                }
            } catch (err) {
                console.error("❌ Request Failed");
            }
        }
    }
}


runSentinel();
