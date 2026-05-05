import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

class MongoClientWrapper:
    def __init__(self):
        self.client = MongoClient(os.getenv("MONGO_URI"))
        self.db = self.client[os.getenv("MONGO_DB_NAME", "sentinel_db")]
        self.collection = self.db["knowledge_base"]

    def get_context(self, query_vector):
        pipeline = [
            {
                "$vectorSearch": {
                    "index": "vector_index",
                    "path": "embedding",
                    "queryVector": query_vector,
                    "numCandidates": 50,
                    "limit": 3
                }
            },
            {
                "$project": {
                    "text": 1,
                    "score": { "$meta": "vectorSearchScore" }
                }
            }
        ]
        
        results = list(self.collection.aggregate(pipeline))
        
        context_parts = []
        for doc in results:
            if doc.get("score", 0) > 0.75:
                context_parts.append(doc["text"])
        
        return "\n".join(context_parts)



mongo_client = MongoClientWrapper()
