import redis
import numpy as np
from typing import Optional, List
from redis.commands.search.field import TextField, VectorField
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.commands.search.query import Query
from src.config.env import get_env_variable
from src.config.logger import logger

"""
SERVICE: Sentinel-AI Tiered Cache Configuration Engine (Redis)
DESCRIPTION: Orchestrates Tier-1 Exact caching and Tier-2 Semantic Vector Index searches using HNSW distance spaces.
STANDARDS: Synchronous schema bootstrapping, vectorized pipeline array parsing, telemetry tracking integrations.
"""

REDIS_URL = get_env_variable("REDIS_URL")
client = redis.from_url(REDIS_URL)
json_client = client.json()


def ensure_semantic_index() -> None:
    try:
        client.ft("idx:semantic_cache").info()
    except Exception:
        schema = (
            TextField("$.query", as_name="query"),
            TextField("$.response", as_name="response"),
            VectorField(
                "$.embedding",
                "HNSW",
                {"TYPE": "FLOAT32", "DIM": 384, "DISTANCE_METRIC": "COSINE"},
                as_name="embedding",
            ),
        )
        client.ft("idx:semantic_cache").create_index(
            fields=schema,
            definition=IndexDefinition(prefix=["cache:"], index_type=IndexType.JSON),
        )
        logger.info(
            "Sentinel-Worker: HNSW Semantic Vector search index generated on metadata layers"
        )


def check_semantic_cache(vector: List[float], threshold: float = 0.15) -> Optional[str]:
    try:
        vector_buffer = np.array(vector, dtype=np.float32).tobytes()

        q = (
            Query("*=>[KNN 1 @embedding $vec AS score]")
            .sort_by("score")
            .return_fields("response", "score")
            .dialect(2)
        )

        params = {"vec": vector_buffer}
        results = client.ft("idx:semantic_cache").search(q, query_params=params)

        if results.docs:
            score = float(results.docs[0].score)
            if score < threshold:
                logger.info(
                    "Tier-2 semantic index matching vector found",
                    {"similarityScore": score},
                )
                return results.docs[0].response
        return None
    except Exception as e:
        logger.error(
            "Tier-2 relational multi-vector lookups context aborted",
            {"err": {"message": str(e), "type": type(e).__name__}},
        )
        return None


def save_to_cache_tiers(
    query: str, query_hash: str, response: str, vector: List[float]
) -> None:
    try:
        client.setex(f"exact:{query_hash}", 86400, response)

        cache_id = f"cache:{query_hash[:16]}"
        json_client.set(
            cache_id, "$", {"query": query, "response": response, "embedding": vector}
        )
    except Exception as e:
        logger.error(
            "Tiered caching validation pipeline operations failed transactional broadcast",
            {
                "queryHash": query_hash,
                "err": {"message": str(e), "type": type(e).__name__},
            },
        )


def set_vector_cache(
    cache_key: str, vector: List[float], doc_text: str, ttl: int = 86400
) -> None:
    """
    🎯 SYNTHETIC HYDRATION STORAGE HOOK
    DESCRIPTION: Commits generated synthetic intents and embeddings directly into the Redis JSON search indices.
    """
    try:
        # Extract query text safely from cache_key details or mock metadata parsing if required
        # Structured contract aligns with HNSW Schema index ($.query, $.response, $.embedding)
        payload = {
            "query": "Synthetic Pre-cached Intent Context",
            "response": doc_text,
            "embedding": vector,
        }

        json_client.set(cache_key, "$", payload)
        client.expire(cache_key, ttl)

    except Exception as e:
        logger.error(
            "Hydration pre-cache vector transactional insertion aborted",
            {
                "cacheKey": cache_key,
                "err": {"message": str(e), "type": type(e).__name__},
            },
        )


# Initialize semantic routing layouts instantly on runtime cluster bootups
ensure_semantic_index()
