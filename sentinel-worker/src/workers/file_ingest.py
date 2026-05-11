import asyncio
from bullmq import Worker
from dotenv import load_dotenv
from src.engine.ingestion import process_file_task
from src.config.redis import client
from src.config.env import get_env_variable
load_dotenv()

REDIS_URL = get_env_variable("REDIS_URL")


async def main():
    worker_settings = {"connection": REDIS_URL}
    worker = Worker("ingestion-tasks", process_file_task, worker_settings)
    try:
        await worker.run()
    except Exception as e:
        print(f"Ingestion Worker Error: {e}")
    finally:
        # Cleanup
        await client.disconnect()
        print("🔌 Redis disconnected.")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Ingestion Worker stopped manually.")
