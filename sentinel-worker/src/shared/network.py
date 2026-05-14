from typing import Optional, Dict, Any
import httpx
from src.config.env import get_env_variable
from src.config.logger import logger

"""
SERVICE: Sentinel-AI Gateway Synchronization Link
DESCRIPTION: Dispatches execution summaries back to the Node.js API cluster.
BUSINESS_VALUATION: Reuses persistent TCP connection pools via client singletons to minimize handshake overhead.
"""

GATEWAY_URL = f"{get_env_variable('GATEWAY_URL')}/api/v1/chat/webhook/result"
http_client = httpx.AsyncClient(
    limits=httpx.Limits(max_connections=200, max_keepalive_connections=50),
    timeout=15.0,
)


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
    try:
        payload = {
            "jobId": job_id,
            "query": query,
            "response": response,
            "status": "completed",
            "is_semantic": is_semantic,
            "should_cache": should_cache,
            "is_knowledge_miss": is_knowledge_miss,
            "source": "cache" if is_semantic else (source or "cloud"),
            "usage": usage
            or {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0,
            },
        }
        resp = await http_client.post(GATEWAY_URL, json=payload)
        if resp.status_code == 200:
            logger.info(
                "Gateway tracking analytics posted smoothly",
                {
                    "jobId": job_id,
                    "source": payload["source"],
                    "tokens": payload["usage"].get("total_tokens", 0),
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
            {
                "jobId": job_id,
                "err": {"message": str(e), "type": type(e).__name__},
            },
        )
