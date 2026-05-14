import json
import re
import asyncio
from typing import List, Any
from groq import AsyncGroq
from src.config.env import get_env_variable
from src.config.logger import logger
from src.config.redis import set_vector_cache

"""
SERVICE: Sentinel-AI Autonomous Text Hydrator Engine
DESCRIPTION: Evaluates raw content texts via LLM layers, synthesizes probabilistic query paths, and stores pre-cached vectors.
BUSINESS_VALUATION: Protects event loop performance during bulk dynamic matrix pre-warmup tasks.
"""

groq_client = AsyncGroq(api_key=get_env_variable("GROQ_API_KEY"))
MODEL_NAME = "llama-3.1-8b-instant"


def run_embedding_sync(model_instance: Any, text: str) -> list:
    vector = model_instance.encode(text, convert_to_numpy=True)
    return vector.tolist() if hasattr(vector, "tolist") else list(vector)


async def hydrate_document_cache(
    doc_text: str, embedding_model: Any, tenant_id: str = "global"
) -> None:
    if not doc_text or len(doc_text.strip()) == 0:
        return
    logger.info(
        "Starting synthetic intent parsing pipeline on uploaded documentation block"
    )
    prompt = f"""Task: Generate 3 likely user questions from this doc.
    Return ONLY a JSON object. No intro, no outro.
    Format: {{"questions": ["q1", "q2", "q3"]}}
    Document: {doc_text[:500]}"""
    try:
        completion = await groq_client.chat.completions.create(
            model=MODEL_NAME,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"},
        )
        response_text = completion.choices[0].message.content or ""
        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        response_data = json.loads(json_match.group() if json_match else response_text)
        questions: List[str] = response_data.get("questions", [])
        loop = asyncio.get_running_loop()
        for q in questions:
            try:
                vector = await loop.run_in_executor(
                    None, run_embedding_sync, embedding_model, q
                )
                cache_id = re.sub(r"[^a-zA-Z0-9]", "", q)[:16]
                cache_key = f"cache:{tenant_id}:{cache_id}"
                await set_vector_cache(
                    cache_key=cache_key,
                    vector=vector,
                    doc_text=doc_text,
                    ttl=86400,
                )
                logger.info(
                    "Synthetic predictive question context cached securely",
                    {"intent": q},
                )
            except Exception as cache_err:
                logger.error(
                    "Predictive tracking state variable write operation failure",
                    {
                        "intent": q,
                        "err": {
                            "message": str(cache_err),
                            "type": type(cache_err).__name__,
                        },
                    },
                )
    except Exception as e:
        logger.error(
            "Autonomous storage pre-warmup generation session aborted on fault boundaries",
            {"err": {"message": str(e), "type": type(e).__name__}},
        )
