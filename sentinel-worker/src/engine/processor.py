import hashlib
import httpx
from sentence_transformers import SentenceTransformer
from src.engine.llm_handler import generate_response
from src.config import mongo
from src.config.redis import check_semantic_cache, save_to_cache_tiers
from src.config.env import get_env_variable
# 1. Configuration
MODEL_NAME = "all-MiniLM-L6-v2"
GATEWAY_URL = f"{get_env_variable("GATEWAY_URL")}/api/v1/chat/webhook/result"
print(GATEWAY_URL)
print(f"📡 Sentinel Engine: Loading {MODEL_NAME}...")
model = SentenceTransformer(MODEL_NAME)
print("✅ Sentinel Engine: Ready.")

# 2. Intent Classifier Helper
def classify_intent(query: str):
    """
    Decides if the query is about Sentinel's private knowledge 
    or just a general/generic question.
    """
    knowledge_keywords = [
        "sentinel", "osaf", "middleware", "creator", "policy", 
        "architecture", "tier", "security", "features", "internal"
    ]
    query_lower = query.lower()
    is_private = any(word in query_lower for word in knowledge_keywords)
    return "PRIVATE" if is_private else "GENERIC"

# 3. Main Task Handler
async def handle_task(job, job_id):
    """
    Main pipeline for processing queries:
    T1 (Gateway) -> T2 (Semantic) -> Intent Route -> (Mongo/LLM)
    """
    sentinel_job_id = job.opts.get("jobId") or job_id
    query = job.data.get("query")
    query_hash = hashlib.md5(query.lower().strip().encode()).hexdigest()

    try:
        print(f"\n🛠️  [PROCESSING]: {sentinel_job_id}")

        # Vectorization
        vector = model.encode(query, convert_to_numpy=True).tolist()

        # --- STAGE 1: TIER-2 CHECK (Semantic Cache) ---
        # Sab se pehle bachat dekhte hain, chahe generic ho ya private
        cached_res = check_semantic_cache(vector)
        if cached_res:
            print(f"🎯 [T2-HIT]: {sentinel_job_id}")
            await notify_gateway(
                job_id=sentinel_job_id, 
                query=query, 
                response=cached_res, 
                is_semantic=True, 
                should_cache=False, 
                is_knowledge_miss=False
            )
            return cached_res

        # --- STAGE 2: INTENT CLASSIFICATION & ROUTING ---
        intent = classify_intent(query)
        print(f"🛤️  [ROUTING]: Query classified as {intent}")

        if intent == "PRIVATE":
            # 🛡️ PRIVATE FLOW: Check MongoDB Atlas
            context = mongo.get_context(vector)
            
            if not context:
                # Guardrail Hit: Private question but no specific data in Mongo
                print(f"🛡️  [GUARDRAIL-HIT]: No context for private query {sentinel_job_id}")
                guard_msg = "I'm sorry, I don't have this information in my private knowledge base."
                
                await notify_gateway(
                    job_id=sentinel_job_id, 
                    query=query, 
                    response=guard_msg, 
                    is_semantic=False, 
                    should_cache=False, 
                    is_knowledge_miss=True
                )
                return guard_msg

            # Private query WITH context -> Call LLM in Private Mode
            print("🚀 [LLM-PRIVATE]: Generating factual response...")
            response = await generate_response(query, context=context, mode="private")
        
        else:
            # 🌍 GENERIC FLOW: Directly call LLM in General Mode
            print("🌍 [LLM-GENERIC]: Generating general knowledge response...")
            response = await generate_response(query, context=None, mode="generic")

        # --- STAGE 3: CACHING & SYNC ---
        # Save to Redis tiers (Worker side)
        save_to_cache_tiers(query, query_hash, response, vector)

        # Notify Gateway to update Tier-1 and Dashboard
        await notify_gateway(
            job_id=sentinel_job_id, 
            query=query, 
            response=response, 
            is_semantic=False, 
            should_cache=True, 
            is_knowledge_miss=False
        )

        print(f"✅ [FINISHED]: {sentinel_job_id}")
        return response

    except Exception as e:
        print(f"❌ [CRITICAL-ERROR] {sentinel_job_id}: {str(e)}")
        raise e

# 4. Webhook Notification Helper
async def notify_gateway(job_id, query, response, is_semantic, should_cache, is_knowledge_miss):
    payload = {
        "jobId": job_id,
        "query": query,
        "response": response,
        "status": "completed",
        "is_semantic": is_semantic,
        "should_cache": should_cache,
        "is_knowledge_miss": is_knowledge_miss
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(GATEWAY_URL, json=payload, timeout=15.0)
            if resp.status_code == 200:
                print(f"📡 [GATEWAY-SYNC]: OK | Semantic: {is_semantic} | Block: {is_knowledge_miss}")
            else:
                print(f"⚠️ [GATEWAY-SYNC]: Failed with status {resp.status_code}")
    except Exception as e:
        print(f"⚠️ [WEBHOOK-FAILED]: {str(e)}")
