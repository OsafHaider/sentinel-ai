from pymongo import MongoClient
from dotenv import load_dotenv
from src.config.env import get_env_variable
from src.config.logger import logger

load_dotenv()

"""
SERVICE: Sentinel-AI Vector Storage & Knowledge Layer (MongoDB)
DESCRIPTION: Handles transactional ingestions and high-performance pipeline aggregation mappings.
STANDARDS: Synchronous initialization pools, semantic score compliance tracking, structured traceback containment.
"""

client = MongoClient(get_env_variable("MONGO_URI"))
db = client[get_env_variable("MONGO_DB_NAME")]
collection = db["knowledge_base"]


def insert_knowledge(data: dict):
    try:
        result = collection.insert_one(data)
        return result.inserted_id
    except Exception as e:
        logger.error(
            "MongoDB ingestion transactional write state failed",
            {"err": {"message": str(e), "type": type(e).__name__}},
        )
        return None


def get_context(query_vector: list):
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
        results = list(collection.aggregate(pipeline))
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
