import redis
import numpy as np
from redis.commands.search.field import TextField, VectorField
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.commands.search.query import Query
from src.config.env import get_env_variable
# 1. Connection Setup
REDIS_URL = get_env_variable("REDIS_URL")
client = redis.from_url(REDIS_URL)
json_client = client.json()

def ensure_semantic_index():
    """Worker start hote waqt Index check karega"""
    try:
        client.ft("idx:semantic_cache").info()
    except:
        schema = (
            TextField("$.query", as_name="query"),
            TextField("$.response", as_name="response"),
            VectorField("$.embedding", "HNSW", {
                "TYPE": "FLOAT32",
                "DIM": 384,
                "DISTANCE_METRIC": "COSINE"
            }, as_name="embedding")
        )
        client.ft("idx:semantic_cache").create_index(
            fields=schema,
            definition=IndexDefinition(prefix=["cache:"], index_type=IndexType.JSON)
        )
        print("✅ Sentinel-Worker: Semantic Index Created.")

def check_semantic_cache(vector, threshold=0.15):
    """🎯 Tier-2: Semantic Vector Search"""
    try:
        # Convert list to float32 bytes for Redis KNN
        vector_buffer = np.array(vector, dtype=np.float32).tobytes()
        
        q = Query("*=>[KNN 1 @embedding $vec AS score]")\
            .sort_by("score")\
            .return_fields("response", "score")\
            .dialect(2)
        
        params = {"vec": vector_buffer}
        results = client.ft("idx:semantic_cache").search(q, query_params=params)

        if results.docs:
            score = float(results.docs[0].score)
            if score < threshold:
                print(f"🎯 [T2-HIT] Similarity Score: {score}")
                return results.docs[0].response
        return None
    except Exception as e:
        print(f"❌ Tier-2 Search Error: {e}")
        return None

def save_to_cache_tiers(query, query_hash, response, vector):
    """💾 Update Tier-1 (Gateway) & Tier-2 (Worker) simultaneously"""
    try:
        # 1. Update Tier-1: Exact Match (for Node.js)
        # 24 Hours TTL rakha hai
        client.setex(f"exact:{query_hash}", 86400, response)
        
        # 2. Update Tier-2: Semantic Cache (for Python)
        cache_id = f"cache:{query_hash[:16]}"
        json_client.set(cache_id, "$", {
            "query": query,
            "response": response,
            "embedding": vector
        })
        print(f"💾 [SYNC-OK] T1 and T2 updated for: {query_hash}")
    except Exception as e:
        print(f"❌ Cache Sync Error: {e}")

# Worker start hotay hi index ensure karo
ensure_semantic_index()
