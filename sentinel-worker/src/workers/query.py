import asyncio
from bullmq import Worker
from dotenv import load_dotenv
from src.engine.processor import handle_task
from src.config.redis import client
from src.config.env import get_env_variable
from src.config.logger import logger  # Shared central logger module import

load_dotenv()

"""
SERVICE: Sentinel-AI Core Asynchronous Query Worker
DESCRIPTION: Subscribes to the BullMQ Redis queue cluster and orchestrates background jobs.
STANDARDS: Global telemetry injection, absolute resource pool cleanup, strict task decoupling.
"""

REDIS_URL = get_env_variable("REDIS_URL")


async def main() -> None:
    worker_settings = {"connection": REDIS_URL}

    # Registering BullMQ background worker link
    worker = Worker("chat-tasks", handle_task, worker_settings)

    try:
        logger.info(
            "Sentinel Worker context successfully mounted to task router pipeline"
        )
        await worker.run()
    except Exception as e:
        logger.fatal(
            "Critical fault interface shutdown on task orchestration stream",
            {"err": {"message": str(e), "type": type(e).__name__}},
        )
    finally:
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
