import os
import json
import redis.asyncio as aioredis
from dotenv import load_dotenv

load_dotenv()

class AsyncRedisClient:
    def __init__(self):
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis = None

    async def connect(self):
        """Initialize Redis connection if not already connected"""
        if not self.redis:
            self.redis = await aioredis.from_url(self.redis_url, decode_responses=True)
        return self.redis

    async def disconnect(self):
        """Close Redis connection"""
        if self.redis:
            await self.redis.close()
            self.redis = None

    async def set_vector_cache(self, key, vector, value, ttl=86400):
        """Cache semantic vectors with TTL (default 24 hours)"""
        await self.connect()
        cache_data = {
            "vector": vector,
            "value": value
        }
        await self.redis.setex(key, ttl, json.dumps(cache_data))

    async def get_vector_cache(self, key):
        """Retrieve cached vector data"""
        await self.connect()
        data = await self.redis.get(key)
        if data:
            return json.loads(data)
        return None

    async def set(self, key, value, ex=None):
        """Generic set operation with expiry (ex in seconds)"""
        await self.connect()
        if ex:
            await self.redis.setex(key, ex, value)
        else:
            await self.redis.set(key, value)

    async def get(self, key):
        """Generic get operation"""
        await self.connect()
        return await self.redis.get(key)

    async def incr(self, key):
        """Increment a counter (used for failure/hit tracking)"""
        await self.connect()
        return await self.redis.incr(key)

redis_client = AsyncRedisClient()
