import asyncio
from bullmq import Worker
from src.services.query_worker.processor import handle_task
from src.config.redis import client, ensure_semantic_index
from src.config.env import get_env_variable
from src.config.logger import logger

"""
SERVICE: Sentinel-AI Core Asynchronous Query Worker
DESCRIPTION: Subscribes to the BullMQ Redis queue cluster and orchestrates background jobs.
BUSINESS_VALUATION: Integrates non-blocking vector storage verification cycles directly into core daemon initialization paths.
"""

REDIS_URL = get_env_variable("REDIS_URL")


async def main() -> None:
    worker_settings = {"connection": REDIS_URL}
    worker = None
    try:
        logger.info(
            "Sentinel Worker context initializing storage infrastructure indexes"
        )
        await ensure_semantic_index()

        worker = Worker("chat-tasks", handle_task, worker_settings)
        logger.info(
            "Sentinel Worker context successfully mounted to task router pipeline"
        )
        logger.info("Sentinel Discovery Engine: Online and monitoring knowledge gaps")

        while True:
            await asyncio.sleep(1)
    except Exception as e:
        logger.fatal(
            "Critical fault interface shutdown on task orchestration stream",
            {"err": {"message": str(e), "type": type(e).__name__}},
        )
    finally:
        if worker is not None:
            await worker.close()
        await client.disconnect()
        logger.info(
            "Distributed telemetry and storage infrastructure instances closed safely"
        )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.warn(
            "Worker execution loops terminated by system shell control protocol"
        )
