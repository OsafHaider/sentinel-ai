import json
import logging
import re
import asyncio
from groq import AsyncGroq
from src.config.env import get_env_variable
logger = logging.getLogger(__name__)

rate_limit_sem = asyncio.Semaphore(1)


class SentinelHydrator:
    def __init__(self, embedding_model, redis_client):
        self.client = AsyncGroq(api_key=get_env_variable("GROQ_API_KEY"))
        self.model = "llama-3.1-8b-instant"
        self.embedding_model = embedding_model
        self.redis = redis_client

    async def hydrate_from_document(self, doc_text, tenant_id="global"):
        if not doc_text or len(doc_text.strip()) == 0:
            return

        async with rate_limit_sem:
            print("Sentinel Hydrator: Generating synthetic queries...")

            prompt = f"""Task: Generate 3 likely user questions from this doc.
            Return ONLY a JSON object. No intro, no outro.
            Format: {{"questions": ["q1", "q2", "q3"]}}
            Document: {doc_text[:500]}"""

            try:
                await asyncio.sleep(1)

                completion = await self.client.chat.completions.create(
                    model=self.model,
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    response_format={"type": "json_object"},
                )

                response_text = completion.choices[0].message.content

                json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
                if json_match:
                    response_data = json.loads(json_match.group())
                else:
                    response_data = json.loads(response_text)

                questions = response_data.get("questions", [])

                for q in questions:
                    try:
                        vector = self.embedding_model.encode(q)
                        # String safe hash/id
                        cache_id = re.sub(r"[^a-zA-Z0-9]", "", q)[:16]
                        cache_key = f"cache:{tenant_id}:{cache_id}"

                        await self.redis.set_vector_cache(
                            cache_key, vector, doc_text, ttl=86400
                        )
                        print(f"Pre-cached intent: {q}")
                    except Exception as e:
                        logger.error(f"Failed to cache question: {str(e)}")

            except Exception as e:
                logger.error(f"Hydration Error: {str(e)}")
