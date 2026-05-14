from motor.motor_asyncio import AsyncIOMotorClient
from src.config.env import get_env_variable
from src.config.logger import logger

"""
SERVICE: Sentinel-AI Vector Storage & Knowledge Layer (MongoDB Asyncio)
DESCRIPTION: Handles non-blocking transactional database operations using Motor async engines.
BUSINESS_VALUATION: Eradicates Event Loop starvation across worker threads during heavy storage aggregations.
"""

client = AsyncIOMotorClient(get_env_variable("MONGO_URI"))
db = client[get_env_variable("MONGO_DB_NAME")]
collection = db["knowledge_base"]


async def insert_knowledge(data: dict):
    try:
        result = await collection.insert_one(data)
        return result.inserted_id
    except Exception as e:
        logger.error(
            "MongoDB ingestion transactional write state failed",
            {"err": {"message": str(e), "type": type(e).__name__}},
        )
        return None


async def get_context(query_vector: list):
    pipeline = [
        {
            "$vectorSearch": {
                "index": "vector_index",
                "path": "embedding",
                "queryVector": query_vector,
                "numCandidates": 50,
                "limit": 3,
            }
        },
        {"$project": {"content": 1, "score": {"$meta": "vectorSearchScore"}}},
    ]
    try:
        results = []
        async for doc in collection.aggregate(pipeline):
            results.append(doc)
        context_parts = [
            doc["content"] for doc in results if doc.get("score", 0) > 0.75
        ]
        return "\n".join(context_parts) if context_parts else None
    except Exception as e:
        logger.error(
            "MongoDB semantic vectorSearch aggregation path broken",
            {"err": {"message": str(e), "type": type(e).__name__}},
        )
        return None


# src/config/mongo.py ke andar add karein left-aligned format mein:


async def get_exact_query_document(query_text: str):
    """
    Fallback direct lookup scan to recover documents when spatial vector searches drop thresholds.
    """
    try:
        # 🛡️ FIX: Normalise input text parameter to align with data ingestion formats
        clean_key = query_text.lower().strip()

        record = await collection.find_one({"query": clean_key})
        if record and "content" in record:
            return record["content"]

        # Case-insensitive validation regex scan fallback mapping fields
        record_insensitive = await collection.find_one(
            {"query": {"$regex": f"^{clean_key}$", "$options": "i"}}
        )
        if record_insensitive and "content" in record_insensitive:
            return record_insensitive["content"]

        return None
    except Exception as e:
        logger.error(
            "Fallback exact query document string parsing failed", {"err": str(e)}
        )
        return None
