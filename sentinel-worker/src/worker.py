import asyncio
import os
import httpx
import logging
import redis.asyncio as aioredis
from bullmq import Worker
from dotenv import load_dotenv
from engine import llm_handler
from database import mongo_client
from engine.hydrator import SentinelHydrator
from database.redis_client import redis_client
from engine.embeddings import embedder
import hashlib

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

hydrator = SentinelHydrator(embedder, redis_client)




rate_limit_sem = asyncio.Semaphore(1)



request_counter = 0

async def process_task(job, job_id):
    """Process chat task with Concurrency Control, Hashing & Counter"""
    global request_counter
    request_counter += 1
    
    current_req_num = request_counter
    
    query = job.data.get("query")
    query_vector = job.data.get("embedding")
    webhook_url = os.getenv("GATEWAY_WEBHOOK_URL", "http://localhost:8008/api/v1/chat/webhook/result")

    async with rate_limit_sem:
        try:
            print(f"\n--- 🛠️ [Request #{current_req_num}] Processing Job: {job_id} ---")

            context = mongo_client.get_context(query_vector)

            if context:
                context_hash = hashlib.md5(context.encode()).hexdigest()
                hydration_key = f"hydration_done:{context_hash}"
                
                already_hydrated = await redis_client.get(hydration_key)
                
                if not already_hydrated:
                    print(f"🌊 [Req #{current_req_num}] New Context! Starting Hydration...")
                    task = asyncio.create_task(hydrator.hydrate_from_document(context))
                    task.add_done_callback(lambda t: _handle_hydration_error(t))
                    await redis_client.set(hydration_key, "true", ex=86400)
                else:
                    print(f"⏭️ [Req #{current_req_num}] Context already hydrated. Skipping redundancy.")
                # ------------------------------------------------
            else:
                print(f"⚠️ [Req #{current_req_num}] No relevant context found.")

            response = None
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    await asyncio.sleep(1.5)
                    print(f"🤖 [Req #{current_req_num}] LLM Attempt {attempt + 1}...")
                    response = await llm_handler.generate_response(query, context)
                    break 
                except Exception as e:
                    if "429" in str(e):
                        await redis_client.incr("stats:llm_rate_limit_errors")
                        print(f"🛑 [Req #{current_req_num}] Rate Limit! Retry {attempt + 1}/{max_retries}")
                        if attempt < max_retries - 1:
                            await asyncio.sleep(3 * (attempt + 1))
                            continue
                    raise e

            payload = {
                "jobId": job_id, "query": query, "response": response,
                "embedding": query_vector, "status": "completed",
                "should_cache": bool(context)
            }

            async with httpx.AsyncClient() as client:
                await client.post(webhook_url, json=payload, timeout=10.0)

            print(f"✨ [Req #{current_req_num}] Successfully notified Gateway.")
            return {"status": "success", "request_no": current_req_num}

        except Exception as e:
            print(f"❌ [Req #{current_req_num}] Error: {str(e)}")
            try:
                async with httpx.AsyncClient() as client:
                    await client.post(webhook_url, json={"jobId": job_id, "status": "failed", "error": str(e)}, timeout=5.0)
            except: pass
            raise e


def _handle_hydration_error(task):
    """Handle errors from background hydration task"""
    try:
        task.result()
    except Exception as e:
        logger.error(f"Background hydration failed: {str(e)}")


async def main():
    """Start the BullMQ worker"""
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

    redis_connection = await aioredis.from_url(redis_url)

    worker = Worker("chat-tasks", process_task)

    print(f"🛡️ Sentinel Worker is live on {redis_url}")
    print("🚀 Ready to process and hydrate...")

    try:
        await worker.run()
    finally:
        # Cleanup
        await redis_client.disconnect()
        await redis_connection.close()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Worker stopped manually.")
