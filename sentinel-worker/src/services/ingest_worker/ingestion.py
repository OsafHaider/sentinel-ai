import os
import fitz
from datetime import datetime, timezone
from typing import Any, Dict
from concurrent.futures import ThreadPoolExecutor
import asyncio
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import httpx
from src.config.mongo import collection
from src.config.env import get_env_variable
from src.config.logger import logger
from src.services.ingest_worker.hydrator import hydrate_document_cache

"""
SERVICE: Sentinel-AI Vector Ingestion Pipeline Engine
DESCRIPTION: Extracts textual content from files, splits records into semantic windows, and pushes matrix vector spaces.
BUSINESS_VALUATION: Thread-isolates batch embedding matrix workloads and applies native async Motor drivers.
"""

MODEL_NAME = "all-MiniLM-L6-v2"
model = SentenceTransformer(MODEL_NAME)
GATEWAY_WEBHOOK = f"{get_env_variable('GATEWAY_URL')}/api/v1/chat/webhook/ingest-status"
thread_pool = ThreadPoolExecutor(max_workers=4)
http_client = httpx.AsyncClient(
    limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
    timeout=10.0,
)


def extract_pdf_text_sync(file_path: str) -> str:
    doc = fitz.open(file_path)
    full_text = "".join(page.get_text() for page in doc)
    doc.close()
    return full_text


def compute_batch_embeddings(chunks_list: list) -> list:
    return model.encode(chunks_list, convert_to_numpy=True).tolist()


async def process_file_task(job: Any, job_id: str) -> Dict[str, Any]:
    file_path = job.data.get("filePath", "")
    file_name = job.data.get("fileName", "")
    if not os.path.exists(file_path):
        logger.error(
            "Data tracking source file not located on system storage matrix",
            {"filePath": file_path},
        )
        return {"status": "failed", "error": "File not found"}
    try:
        logger.info(
            "Executing vector generation processing on document node",
            {"fileName": file_name},
        )
        loop = asyncio.get_running_loop()
        full_text = await loop.run_in_executor(
            thread_pool, extract_pdf_text_sync, file_path
        )
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800, chunk_overlap=100, separators=["\n\n", "\n", ".", " ", ""]
        )
        chunks = text_splitter.split_text(full_text)
        total_chunks = len(chunks)
        if total_chunks == 0:
            logger.warn(
                "Document parsing cycle generated zero semantic text chunks",
                {"fileName": file_name},
            )
            return {"status": "completed", "chunks": 0}
        embeddings = await loop.run_in_executor(
            thread_pool, compute_batch_embeddings, chunks
        )
        bulk_documents = [
            {
                "source": file_name,
                "content": chunk_text,
                "embedding": embeddings[i],
                "metadata": {
                    "chunk_index": i,
                    "total_chunks": total_chunks,
                    "ingested_at": datetime.now(timezone.utc).isoformat() + "Z",
                },
            }
            for i, chunk_text in enumerate(chunks)
        ]
        await collection.insert_many(bulk_documents)
        logger.info(
            "Vector space batch ingestion transaction committed smoothly",
            {"fileName": file_name, "chunkSize": total_chunks},
        )
        await hydrate_document_cache(doc_text=full_text, embedding_model=model)
        await notify_ingestion_complete(file_name, total_chunks)
        await loop.run_in_executor(thread_pool, os.remove, file_path)
        return {"status": "completed", "chunks": total_chunks}
    except Exception as e:
        logger.error(
            "Critical fault state generated inside pipeline parsing engine",
            {
                "fileName": file_name,
                "err": {"message": str(e), "type": type(e).__name__},
            },
        )
        raise e


async def notify_ingestion_complete(file_name: str, chunk_count: int) -> None:
    payload = {
        "fileName": file_name,
        "status": "completed",
        "message": f"Sentinel has learned {chunk_count} new facts from {file_name}",
    }
    try:
        resp = await http_client.post(GATEWAY_WEBHOOK, json=payload)
        if resp.status_code != 200:
            logger.warn(
                "Gateway parsing notification response rejected during worker tracking call",
                {"statusCode": resp.status_code},
            )
    except Exception as web_err:
        logger.error(
            "Outbound notification signal dropped on worker network tracking loops",
            {"err": {"message": str(web_err), "type": type(web_err).__name__}},
        )
