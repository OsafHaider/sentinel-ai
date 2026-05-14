import asyncio
from typing import Any
import hashlib
from sentence_transformers import SentenceTransformer
from src.services.query_worker.classifier import classify_intent
from src.shared.network import notify_gateway
from src.shared.llm_handler import generate_response
from src.config import mongo
from src.config.redis import check_semantic_cache, save_to_cache_tiers
from src.config.logger import logger

"""
SERVICE: Sentinel-AI Orchestration Engine
DESCRIPTION: Manages jobs pipelines from queueing to vector matching and fallback loops.
STANDARDS: Left-aligned modular patterns, atomic database fallbacks, absolute lowercase string scaling.
"""

MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)
logger.info("SentenceTransformer execution weights loaded safely")


def compute_embeddings(text: str) -> list:
    return model.encode(text, convert_to_numpy=True).tolist()


async def handle_task(job: Any, job_id: str) -> str:
    sentinel_job_id = job.opts.get("jobId") or job_id
    query = job.data.get("query", "")
    print(query)
    query_hash = hashlib.md5(query.lower().strip().encode()).hexdigest()

    try:
        logger.info(
            "Processing queue query initialization lifecycle",
            {"jobId": sentinel_job_id},
        )

        loop = asyncio.get_running_loop()
        vector = await loop.run_in_executor(None, compute_embeddings, query)

        cached_res = await check_semantic_cache(vector)
        if cached_res:
            await notify_gateway(
                job_id=sentinel_job_id,
                query=query,
                response=cached_res,
                is_semantic=True,
                should_cache=False,
                is_knowledge_miss=False,
                usage={"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
            )
            return cached_res

        intent = classify_intent(query)
        logger.info(
            "Routing structural graph intent classification established",
            {"jobId": sentinel_job_id, "intent": intent},
        )

        if intent == "PRIVATE":
            # Tier A: Vector search lookup via Atlas Index
            context = await mongo.get_context(vector)

            # 🛡️ THE STRATEGIC SAFEGUARD: If vector matching delays/lags, execute direct text match fallback
            if not context:
                logger.warn(
                    "Vector search missed. Executing fallback regex query lookup scanning text nodes",
                    {"jobId": sentinel_job_id},
                )
                # Normalize string parameters to guarantee a 100% molecular text alignment match
                clean_search_query = query.lower().strip()
                print(clean_search_query)
                context = await mongo.get_exact_query_document(clean_search_query)
                print(context)
            if not context:
                guard_msg = "I'm sorry, I don't have this information in my private knowledge base."
                await notify_gateway(
                    job_id=sentinel_job_id,
                    query=query,
                    response=guard_msg,
                    is_semantic=False,
                    should_cache=False,
                    is_knowledge_miss=True,
                    usage={
                        "prompt_tokens": 0,
                        "completion_tokens": 0,
                        "total_tokens": 0,
                    },
                )
                return guard_msg

            llm_result = await generate_response(query, context=context, mode="private")
        else:
            llm_result = await generate_response(query, context=None, mode="generic")

        llm_output = llm_result["text"]
        usage_stats = llm_result["usage"]
        llm_source = llm_result["source"]

        await save_to_cache_tiers(query, query_hash, llm_output, vector)

        await notify_gateway(
            job_id=sentinel_job_id,
            query=query,
            response=llm_output,
            is_semantic=False,
            should_cache=True,
            is_knowledge_miss=False,
            usage=usage_stats,
            source=llm_source,
        )
        return llm_output

    except Exception as e:
        logger.error(
            "Job lifecycle pipeline execution fault abort triggered",
            {"jobId": sentinel_job_id, "err": str(e)},
        )
        raise e
