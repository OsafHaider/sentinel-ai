import asyncio
from src.services.research_worker.researcher import run_discovery_cycle
from src.config.redis import client
from src.config.logger import logger

"""
SERVICE: Sentinel-AI Autonomous Discovery Microservice Entry Point
DESCRIPTION: Standalone infinity engine daemon polling the distributed knowledge gaps list.
BUSINESS_VALUATION: Manages system cancellation states to prevent network socket and connection leakages.
"""


async def main() -> None:
    try:
        logger.info(
            "Sentinel Discovery Microservice: Bootstrapping engine instance hooks"
        )
        await run_discovery_cycle()
    except asyncio.CancelledError:
        logger.warn(
            "Autonomous discovery cycle worker context gracefully canceled by infrastructure scheduler"
        )
    except Exception as e:
        logger.fatal(
            "Critical crash event inside discovery process execution space",
            {"err": str(e)},
        )
    finally:
        await client.disconnect()
        logger.info(
            "Autonomous research core memory infrastructure channels successfully severed"
        )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.warn(
            "Autonomous discovery service runtime loops manually aborted via shell environment signals"
        )
