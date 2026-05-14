import asyncio
import numpy as np
from typing import Optional, List
import redis.asyncio as aioredis
from redis.commands.search.field import TextField, VectorField
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.commands.search.query import Query
from src.config.env import get_env_variable
from src.config.logger import logger

"""
SERVICE: Sentinel-AI Asynchronous Caching Infrastructure (Redis Asyncio)
DESCRIPTION: Non-blocking HNSW vector matching engine using async-ready network pooling drivers.
BUSINESS_VALUATION: Eliminates trace indexing sequence errors via guarded collection validations.
"""

REDIS_URL = get_env_variable("REDIS_URL")
client = aioredis.from_url(REDIS_URL, decode_responses=False)

# 🛡️ THE STRATEGIC EXPORT LAYER: Declaring the static JSON execution handler object globally
json_client = client.json()


def serialize_vector(vector: List[float]) -> bytes:
    return np.array(vector, dtype=np.float32).tobytes()


async def ensure_semantic_index() -> None:
    try:
        await client.ft("idx:semantic_cache").info()
        logger.info(
            "Sentinel-Worker: Async HNSW Semantic Vector search index verified active"
        )
    except Exception:
        try:
            schema = (
                TextField("$.query", as_name="query"),
                TextField("$.response", as_name="response"),
                VectorField(
                    "$.embedding",
                    "HNSW",
                    {
                        "TYPE": "FLOAT32",
                        "DIM": 384,
                        "DISTANCE_METRIC": "COSINE",
                    },
                    as_name="embedding",
                ),
            )
            await client.ft("idx:semantic_cache").create_index(
                fields=schema,
                definition=IndexDefinition(
                    prefix=["cache:"], index_type=IndexType.JSON
                ),
            )
            logger.info(
                "Sentinel-Worker: Async HNSW Semantic Vector search index generated safely"
            )
        except Exception as create_err:
            logger.error(
                "Failed to execute async index compilation layouts",
                {"err": str(create_err)},
            )


async def check_semantic_cache(
    vector: List[float], threshold: float = 0.15
) -> Optional[str]:
    try:
        loop = asyncio.get_running_loop()
        vector_buffer = await loop.run_in_executor(None, serialize_vector, vector)
        q = (
            Query("*=>[KNN 1 @embedding $vec AS score]")
            .sort_by("score")
            .return_fields("response", "score")
            .dialect(2)
        )
        params = {"vec": vector_buffer}
        results = await client.ft("idx:semantic_cache").search(q, query_params=params)
        if results and hasattr(results, "docs") and len(results.docs) > 0:
            target_doc = results.docs[0]
            if hasattr(target_doc, "score") and hasattr(target_doc, "response"):
                score = float(target_doc.score)
                if score < threshold:
                    logger.info(
                        "Tier-2 semantic index matching vector found via async route",
                        {"similarityScore": score},
                    )
                    return str(target_doc.response)
        return None
    except Exception as e:
        logger.error(
            "Tier-2 transactional cross-vector matching lookup aborted",
            {"err": str(e)},
        )
        return None


async def save_to_cache_tiers(
    query: str, query_hash: str, response: str, vector: List[float]
) -> None:
    try:
        clean_vector = vector.tolist() if hasattr(vector, "tolist") else list(vector)
        payload = {
            "query": query,
            "response": response,
            "embedding": [float(x) for x in clean_vector],
        }
        await asyncio.gather(
            client.setex(f"exact:{query_hash}", 86400, response),
            json_client.set(f"cache:{query_hash[:16]}", "$", payload),
        )
    except Exception as e:
        logger.error(
            "Tiered validation transactional pipeline operations dropped",
            {"queryHash": query_hash, "err": str(e)},
        )


async def set_vector_cache(
    cache_key: str, vector: List[float], doc_text: str, ttl: int = 86400
) -> None:
    try:
        clean_vector = vector.tolist() if hasattr(vector, "tolist") else list(vector)
        payload = {
            "query": "Synthetic Pre-cached Intent Context",
            "response": doc_text,
            "embedding": [float(x) for x in clean_vector],
        }
        await json_client.set(cache_key, "$", payload)
        await client.expire(cache_key, ttl)
    except Exception as e:
        logger.error(
            "Hydration pre-cache vector transactional insertion aborted on fault states",
            {"cacheKey": cache_key, "err": str(e)},
        )
