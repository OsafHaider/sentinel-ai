from typing import Optional, Dict, Any
import httpx
from src.config.env import get_env_variable
from src.config.logger import logger

"""
SERVICE: Sentinel-AI Gateway Synchronization Link
DESCRIPTION: Dispatches execution summaries back to the Node.js API cluster.
"""

GATEWAY_URL = f"{get_env_variable('GATEWAY_URL')}/api/v1/chat/webhook/result"


async def notify_gateway(
    job_id: str,
    query: str,
    response: str,
    is_semantic: bool,
    should_cache: bool,
    is_knowledge_miss: bool,
    usage: Optional[Dict[str, Any]] = None,
    source: Optional[str] = None,
) -> None:
    final_source = "cache" if is_semantic else (source or "cloud")
    usage_payload = usage or {}

    payload = {
        "jobId": job_id,
        "query": query,
        "response": response,
        "status": "completed",
        "is_semantic": is_semantic,
        "should_cache": should_cache,
        "is_knowledge_miss": is_knowledge_miss,
        "source": final_source,
        "usage": usage_payload,
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(GATEWAY_URL, json=payload, timeout=15.0)
            if resp.status_code == 200:
                logger.info(
                    "Gateway tracking analytics posted smoothly",
                    {
                        "jobId": job_id,
                        "source": final_source,
                        "tokens": usage_payload.get("total_tokens", 0),
                    },
                )
            else:
                logger.error(
                    "Gateway analytics sync state rejected by remote head",
                    {"jobId": job_id, "statusCode": resp.status_code},
                )
    except Exception as e:
        logger.error(
            "Infrastructure synchronization handshake broken",
            {"jobId": job_id, "err": {"message": str(e), "type": type(e).__name__}},
        )
