import axios from 'axios';

const scenarios = [
    { name: "RAG Check", query: "What is the company leave policy?" },
    { name: "Guardrail Check", query: "How do I bake a chocolate cake?" },
    { name: "Semantic Check", query: "Tell me about annual leaves" }
];

async function runStandard() {
    console.log("❌ TESTING: STANDARD PIPELINE (NO CACHE)");
    for (const s of scenarios) {
        console.log(`\nTesting ${s.name}: "${s.query}"`);
        const start = Date.now();
        
        const res = await axios.post("http://localhost:8008/api/v1/chat", { 
            query: s.query, 
            userId: "ali_standard",
            bypassCache: true 
        });

        const jobId = res.data.jobId;
        let completed = false;
        while (!completed) {
            await new Promise(r => setTimeout(r, 1000));
            const status = await axios.get(`http://localhost:8008/api/v1/chat/status/${jobId}`);
            if (status.data.state === 'completed' || status.data.result) {
                const end = Date.now();
                console.log(`🤖 Answer: ${JSON.stringify(status.data.result)}`);
                console.log(`⏱️ Time: ${end - start}ms`);
                completed = true;
            }
        }
    }
}
runStandard();
