from pymongo import MongoClient
from dotenv import load_dotenv
from src.config.env import get_env_variable

load_dotenv()

client = MongoClient(get_env_variable("MONGO_URI"))
db = client[get_env_variable("MONGO_DB_NAME")]
collection = db["knowledge_base"]


def insert_knowledge(data):
    try:
        result = collection.insert_one(data)
        return result.inserted_id
    except Exception as e:
        print(f"MongoDB Insert Error: {e}")
        return None


def get_context(query_vector):
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
        print(f"MongoDB Search Error: {e}")
        return None
