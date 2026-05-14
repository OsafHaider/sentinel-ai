import asyncio
from bullmq import Worker
from src.services.ingest_worker.ingestion import process_file_task
from src.config.redis import client, ensure_semantic_index
from src.config.env import get_env_variable
from src.config.logger import logger

"""
SERVICE: Sentinel-AI Bulk Data Ingestion Worker Entry Point
DESCRIPTION: Subscribes to the BullMQ 'ingestion-tasks' Redis channel to process document pipelines.
BUSINESS_VALUATION: Forces proactive schema generation at boot level to eradicate structural cache runtime crashes.
"""

REDIS_URL = get_env_variable("REDIS_URL")


async def main() -> None:
    worker_settings = {"connection": REDIS_URL}
    try:
        logger.info(
            "Sentinel Ingestion Worker initializing database vector index states"
        )
        await ensure_semantic_index()
        worker = Worker("ingestion-tasks", process_file_task, worker_settings)
        logger.info(
            "Sentinel Ingestion Worker engine mounted successfully to background task pool"
        )
        while True:
            await asyncio.sleep(1)
    except Exception as e:
        logger.fatal(
            "Critical structural failure encountered on document parsing orchestration thread",
            {"err": {"message": str(e), "type": type(e).__name__}},
        )
    finally:
        await worker.close()
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
