import asyncio
import hashlib
from datetime import datetime, timezone
from tavily import AsyncTavilyClient
from src.config.redis import client as redis_client, json_client
from src.config.mongo import collection
from src.shared.llm_handler import generate_response
from src.config.logger import logger
from sentence_transformers import SentenceTransformer
from src.config.env import get_env_variable

"""
SERVICE: Sentinel-AI Autonomous Discovery Engine Core Logic
DESCRIPTION: Scrapes web resources for knowledge gaps, vectorizes pure user queries, and upserts to MongoDB & Redis Cache Tiers.
STANDARDS: Left-aligned modular framework, token-identity matching safeguards, instant real-time dual-write cache promotion loops.
"""

model = SentenceTransformer("all-MiniLM-L6-v2")
tavily_api_key = get_env_variable("TAVILY_API_KEY")
tavily_client = AsyncTavilyClient(api_key=tavily_api_key)


def extract_embeddings_sync(text: str) -> list:
    vector = model.encode(text, convert_to_numpy=True)
    return vector.tolist() if hasattr(vector, "tolist") else list(vector)


async def run_discovery_cycle() -> None:
    while True:
        try:
            query = await redis_client.lpop("sentinel:knowledge_gaps")
            if not query:
                await asyncio.sleep(60)
                continue

            original_user_query = query.decode("utf-8") if isinstance(query, bytes) else str(query)
            clean_original_key = original_user_query.lower().strip()
            query_hash = hashlib.md5(clean_original_key.encode()).hexdigest()
            
            logger.info("Autonomous Discovery: Researching new gap", {"query": clean_original_key})

            try:
                response = await tavily_client.search(
                    query=clean_original_key,
                    max_results=3,
                    include_answer=False,
                    include_raw_content=False,
                )
                search_results = [
                    r["content"] for r in response.get("results", []) if "content" in r
                ]
            except Exception as scrape_err:
                logger.error("Tavily AI extraction pipeline dropped", {"err": str(scrape_err)})
                search_results = []

            if not search_results:
                logger.warning("Autonomous Discovery: Web search returned zero clean fragments", {"query": clean_original_key})
                continue

            raw_context = "\n".join(search_results)
            
            summarize_prompt = f"""
            [CRITICAL INSTRUCTION: SYSTEM DESIGN ENVIRONMENT COMPLIANCE]
            Analyze the following web search context and generate a direct, factual, and concise answer for the query.
            Do not provide chat filler text, pleasantries, or introductory sentences.
            
            USER QUERY: {clean_original_key}
            CONTEXT FRAGMENTS:
            {raw_context}
            """
            
            summary_res = await generate_response(summarize_prompt, mode="generic")
            summary_text = summary_res["text"]

            loop = asyncio.get_running_loop()
            vector = await loop.run_in_executor(None, extract_embeddings_sync, clean_original_key)

            current_time_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"

            # 1. Permanent Storage (MongoDB Atlas Engine)
            await collection.update_one(
                {"query": clean_original_key},
                {
                    "$set": {
                        "source": "sentinel-discovery-engine",
                        "content": summary_text,
                        "embedding": vector,
                        "metadata": {
                            "automated": True,
                            "researched_at": current_time_iso,
                        },
                    }
                },
                upsert=True,
            )

            # 🛡️ THE REAL-TIME CACHE PROMOTION PIPELINE: Immediate non-blocking dual-writes to Redis RAM layers
            cache_id = f"cache:{query_hash[:16]}"
            await asyncio.gather(
                # Instant Tier-1 Exact Cache Activation (For under 5ms node proxy interceptions)
                redis_client.setex(f"exact:{query_hash}", 86400, summary_text),
                
                # Instant Tier-2 Semantic Cache Activation (For multi-vector spatial indices matching)
                json_client.set(
                    cache_id, 
                    "$", 
                    {"query": clean_original_key, "response": summary_text, "embedding": vector}
                )
            )
            
            # Synchronize expiration constraints directly for HNSW index structures
            await redis_client.expire(cache_id, 86400)
            
            logger.info("Sentinel successfully learned and instant-cached a new concept across all tiers", {"query": clean_original_key})
            await asyncio.sleep(10)
            
        except Exception as e:
            logger.error("Discovery cycle encountered an infrastructure operation fault", {"err": str(e)})
            await asyncio.sleep(30)
