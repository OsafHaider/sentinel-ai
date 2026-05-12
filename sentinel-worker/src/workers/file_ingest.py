import asyncio
from bullmq import Worker
from dotenv import load_dotenv
from src.engine.ingestion import process_file_task
from src.config.redis import client
from src.config.env import get_env_variable
from src.config.logger import logger

load_dotenv()

"""
SERVICE: Sentinel-AI Bulk Data Ingestion Worker Entry Point
DESCRIPTION: Subscribes to the BullMQ 'ingestion-tasks' Redis channel to process document pipelines.
STANDARDS: Unified logging instrumentation, synchronous configuration fetching, graceful state teardowns.
"""

REDIS_URL = get_env_variable("REDIS_URL")


async def main() -> None:
    worker_settings = {"connection": REDIS_URL}
    worker = Worker("ingestion-tasks", process_file_task, worker_settings)

    try:
        logger.info(
            "Sentinel Ingestion Worker engine mounted successfully to background task pool"
        )
        await worker.run()
    except Exception as e:
        logger.fatal(
            "Critical structural failure encountered on document parsing orchestration thread",
            {"err": {"message": str(e), "type": type(e).__name__}},
        )
    finally:
        await client.disconnect()
        logger.info(
            "Data ingestion persistence layers and cache infrastructure linkages severed gracefully"
        )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.warn(
            "Document parser thread manually disconnected via process terminal interruption signals"
        )
